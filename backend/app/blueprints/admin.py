from flask import Blueprint, jsonify, request, session, current_app
from functools import wraps
from ..database import supabase
from ..clearance_service import resolve_current_discord_user_id
from ..security import require_csrf
from ..cache import ttl_cache

admin_bp = Blueprint('admin', __name__)

def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return jsonify({"error": "Authentication required"}), 401
        if not session["user"].get("is_admin"):
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated

def fetch_time_series_data(table_name: str, date_column: str = 'created_at', days: int = None, since: str = None):
    rows = []
    offset = 0
    batch_size = 1000
    
    query = supabase.from_(table_name).select(date_column)
    if since:
        query = query.gte(date_column, since)
    
    while True:
        resp = query.range(offset, offset + batch_size - 1).execute()
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < batch_size:
            break
        offset += batch_size
        if days and len(rows) >= days * 1000:
            break
    
    return rows

def count_by_date(rows, date_column: str = 'created_at'):
    counts = {}
    for row in rows:
        ts = row.get(date_column)
        if not ts:
            continue
        day = str(ts)[:10]
        if day:
            counts[day] = counts.get(day, 0) + 1
    return counts

def format_date_series(counts, days: int = None, cumulative: bool = False):
    from datetime import date, timedelta
    if not counts:
        return []
    
    if days:
        end = date.today()
        start = end - timedelta(days=days - 1)
    else:
        start = date.fromisoformat(min(counts.keys()))
        end = date.today()
    
    out = []
    running = 0
    current = start
    while current <= end:
        day = current.isoformat()
        daily_count = counts.get(day, 0)
        if cumulative:
            running += daily_count
            out.append({'date': day, 'count': running})
        else:
            out.append({'date': day, 'count': daily_count})
        current += timedelta(days=1)
    return out

def sum_last_days(counts, days: int):
    from datetime import date, timedelta
    today = date.today()
    return sum(counts.get((today - timedelta(days=i)).isoformat(), 0) for i in range(days - 1, -1, -1))

def trend_pct(current, previous):
    if previous in (None, 0):
        return None
    value = ((current - previous) / previous) * 100
    return round(value, 1) if value == value else None

@admin_bp.route('/api/admin/documents')
@require_admin
def load_admin_documents():
    try:
        docs = ttl_cache('admin_documents', 30, lambda: supabase.from_('site_documents').select('*').execute().data or [])
        return jsonify({"documents": docs})
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin documents: {e}", exc_info=True)
        return jsonify({"documents": []})

@admin_bp.route('/api/admin/documents/<doc_key>', methods=['PUT'])
@require_admin
@require_csrf
def save_admin_document(doc_key):
    payload = request.get_json(silent=True) or {}
    title = payload.get('title') or ''
    content_md = payload.get('content_md') or ''
    try:
        from datetime import datetime, timezone
        resp = supabase.from_('site_documents').upsert({
            'doc_key': doc_key,
            'title': title,
            'content_md': content_md,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }, on_conflict='doc_key').execute()
        if getattr(resp, 'error', None):
            current_app.logger.error(f"Failed to upsert site_documents {doc_key}: {resp.error}")
            return jsonify({"error": "Failed to save document", "detail": str(resp.error)}), 500
        return jsonify({"success": True}), 200
    except Exception as e:
        current_app.logger.error(f"Exception saving site_documents {doc_key}: {e}", exc_info=True)
        return jsonify({"error": "Failed to save document", "detail": str(e)}), 500

@admin_bp.route('/api/admin/clearances/daily')
@require_admin
def load_admin_clearances_daily():
    try:
        days = int(request.args.get('days', 14))
        days = max(1, min(days, 365))
    except (ValueError, TypeError):
        days = 14
    
    try:
        from datetime import date, timedelta
        since = (date.today() - timedelta(days=days - 1)).isoformat()
        rows = fetch_time_series_data('clearance_generations', 'created_at', since=since)
        counts = count_by_date(rows)
        return jsonify(format_date_series(counts, days, cumulative=False))
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin daily clearances: {e}", exc_info=True)
        return jsonify([])

@admin_bp.route('/api/admin/analytics/overview')
@require_admin
def load_admin_analytics_overview():
    try:
        def build():
            clearance_rows = fetch_time_series_data('clearance_generations', 'created_at')
            clearance_counts = count_by_date(clearance_rows)
            clearance_series = format_date_series(clearance_counts, cumulative=False)

            user_rows = fetch_time_series_data('discord_users', 'created_at')
            user_counts = count_by_date(user_rows)
            user_growth_series = format_date_series(user_counts, cumulative=True)

            from datetime import date, timedelta
            today_key = date.today().isoformat()
            yesterday_key = (date.today() - timedelta(days=1)).isoformat()

            total_clearances = sum(clearance_counts.values())
            today_clearances = clearance_counts.get(today_key, 0)
            last7_clearances = sum_last_days(clearance_counts, 7)
            last15_clearances = sum_last_days(clearance_counts, 15)
            last30_clearances = sum_last_days(clearance_counts, 30)
            total_users = user_growth_series[-1]['count'] if user_growth_series else 0

            previous7_clearances = sum_last_days(clearance_counts, 14) - last7_clearances if clearance_counts else 0
            previous15_clearances = sum_last_days(clearance_counts, 30) - last15_clearances if clearance_counts else 0
            previous30_clearances = sum_last_days(clearance_counts, 60) - last30_clearances if clearance_counts else 0
            previous_today = clearance_counts.get(yesterday_key, 0)
            previous_users = user_growth_series[-31]['count'] if len(user_growth_series) > 30 else 0

            return {
                'metrics': {
                    'total_clearances': total_clearances,
                    'today_clearances': today_clearances,
                    'last7_clearances': last7_clearances,
                    'last15_clearances': last15_clearances,
                    'last30_clearances': last30_clearances,
                    'total_users': total_users,
                    'trends': {
                        'total_clearances': trend_pct(last30_clearances, previous30_clearances),
                        'today_clearances': trend_pct(today_clearances, previous_today),
                        'last7_clearances': trend_pct(last7_clearances, previous7_clearances),
                        'last15_clearances': trend_pct(last15_clearances, previous15_clearances),
                        'last30_clearances': trend_pct(last30_clearances, previous30_clearances),
                        'total_users': trend_pct(total_users, previous_users),
                    },
                },
                'charts': {
                    'clearances_per_day': clearance_series[-30:],
                    'user_growth': user_growth_series,
                },
            }
        payload = ttl_cache('admin_analytics_overview', 30, build)
        return jsonify(payload)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin analytics overview: {e}", exc_info=True)
        return jsonify({"metrics": {}, "charts": {"clearances_per_day": [], "user_growth": []}})

@admin_bp.route('/api/admin/analytics/all')
@require_admin
def load_admin_analytics_all():
    try:
        def build():
            clearance_rows = fetch_time_series_data('clearance_generations', 'created_at')
            clearance_counts = count_by_date(clearance_rows)
            clearance_series = format_date_series(clearance_counts, cumulative=False)

            user_rows = fetch_time_series_data('discord_users', 'created_at')
            user_counts = count_by_date(user_rows)
            user_growth_series = format_date_series(user_counts, cumulative=True)

            from datetime import date, timedelta
            today_key = date.today().isoformat()
            yesterday_key = (date.today() - timedelta(days=1)).isoformat()

            total_clearances = sum(clearance_counts.values())
            today_clearances = clearance_counts.get(today_key, 0)
            last7_clearances = sum_last_days(clearance_counts, 7)
            last15_clearances = sum_last_days(clearance_counts, 15)
            last30_clearances = sum_last_days(clearance_counts, 30)
            total_users = user_growth_series[-1]['count'] if user_growth_series else 0

            previous7_clearances = sum_last_days(clearance_counts, 14) - last7_clearances if clearance_counts else 0
            previous15_clearances = sum_last_days(clearance_counts, 30) - last15_clearances if clearance_counts else 0
            previous30_clearances = sum_last_days(clearance_counts, 60) - last30_clearances if clearance_counts else 0
            previous_today = clearance_counts.get(yesterday_key, 0)
            previous_users = user_growth_series[-31]['count'] if len(user_growth_series) > 30 else 0

            return {
                'metrics': {
                    'total_clearances': total_clearances,
                    'today_clearances': today_clearances,
                    'last7_clearances': last7_clearances,
                    'last15_clearances': last15_clearances,
                    'last30_clearances': last30_clearances,
                    'total_users': total_users,
                    'trends': {
                        'total_clearances': trend_pct(last30_clearances, previous30_clearances),
                        'today_clearances': trend_pct(today_clearances, previous_today),
                        'last7_clearances': trend_pct(last7_clearances, previous7_clearances),
                        'last15_clearances': trend_pct(last15_clearances, previous15_clearances),
                        'last30_clearances': trend_pct(last30_clearances, previous30_clearances),
                        'total_users': trend_pct(total_users, previous_users),
                    },
                },
                'charts': {
                    'clearances_per_day': clearance_series,
                    'user_growth': user_growth_series,
                },
            }
        payload = ttl_cache('admin_analytics_all', 30, build)
        return jsonify(payload)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin analytics (all): {e}", exc_info=True)
        return jsonify({'metrics': {}, 'charts': {'clearances_per_day': [], 'user_growth': []}})

@admin_bp.route('/api/admin/analytics/clearances-per-day')
@require_admin
def analytics_clearances_per_day():
    try:
        def build():
            rows = fetch_time_series_data('clearance_generations', 'created_at')
            counts = count_by_date(rows)
            return [{'date': k, 'count': v} for k, v in sorted(counts.items())]
        out = ttl_cache('analytics_clearances_per_day', 30, build)
        return jsonify(out)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin clearances per day: {e}", exc_info=True)
        return jsonify([])

@admin_bp.route('/api/admin/analytics/clearances-last-7-days')
@require_admin
def clearances_last_7_days():
    return analytics_clearances_last_n(7)

@admin_bp.route('/api/admin/analytics/clearances-last-30-days')
@require_admin
def clearances_last_30_days():
    return analytics_clearances_last_n(30)

def analytics_clearances_last_n(days):
    try:
        def build():
            from datetime import date, timedelta
            since = (date.today() - timedelta(days=days - 1)).isoformat()
            rows = fetch_time_series_data('clearance_generations', 'created_at', since=since)
            counts = count_by_date(rows)
            return format_date_series(counts, days, cumulative=False)
        out = ttl_cache(f'analytics_clearances_last_n:{days}', 30, build)
        return jsonify(out)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin clearances last {days} days: {e}", exc_info=True)
        return jsonify([])

@admin_bp.route('/api/admin/user-growth')
@require_admin
def load_admin_user_growth():
    try:
        days = int(request.args.get('days', 30))
        days = max(1, min(days, 365))
    except (ValueError, TypeError):
        days = 30
    
    all_time = request.args.get('all', 'false').lower() in ('1', 'true', 'yes')
    try:
        rows = fetch_time_series_data('discord_users', 'created_at', days=days if not all_time else None)
        counts = count_by_date(rows)

        out = []
        cum = 0
        if all_time:
            for d in sorted(counts.keys()):
                cum += counts.get(d, 0)
                out.append({'date': d, 'count': cum})
        else:
            from datetime import date, timedelta
            today = date.today()
            for i in range(days - 1, -1, -1):
                d = (today - timedelta(days=i)).isoformat()
                cum += counts.get(d, 0)
                out.append({'date': d, 'count': cum})
        return jsonify(out)
    except Exception as e:
        current_app.logger.warning(f"Exception fetching admin user growth: {e}", exc_info=True)
        return jsonify([])

@admin_bp.route('/api/admin/feedback')
@require_admin
def load_admin_feedback():
    try:
        page = int(request.args.get("page", 1))
        page = max(1, page)
    except (ValueError, TypeError):
        page = 1
    
    try:
        per_page = int(request.args.get("per_page", 25))
        per_page = max(1, min(per_page, 100))
    except (ValueError, TypeError):
        per_page = 25
    
    start = (page - 1) * per_page
    end = start + per_page - 1
    try:
        resp = supabase.from_("feedback").select("*").order("created_at", desc=True).range(start, end).execute()
        return jsonify(resp.data or [])
    except Exception as e:
        current_app.logger.error(f"Failed to fetch admin feedback: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch feedback"}), 500

@admin_bp.route('/api/admin/feedback/push', methods=['POST'])
@require_admin
@require_csrf
def push_feedback_prompt():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message")

    if not message or not str(message).strip():
        return jsonify({"error": "message is required"}), 400

    try:
        from datetime import datetime, timedelta, timezone
        expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        record = {"message": message, "expires_at": expires_at}
        resp = supabase.from_("feedback_prompts").insert(record).execute()
        return jsonify({"success": True, "prompt": resp.data[0] if resp.data else None})
    except Exception as e:
        current_app.logger.error(f"Failed to push feedback prompt: {e}", exc_info=True)
        return jsonify({"error": "Failed to push feedback prompt", "details": str(e)}), 500