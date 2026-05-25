from datetime import date, timedelta, datetime, timezone
from flask import jsonify, request, session
from .database import supabase
from .external_api import (
    get_controllers,
    get_atis,
    get_flight_plans,
    get_health,
    search_flight_plan,
    resolve_controller_for_airport,
    resolve_atis_for_airport,
    generate_squawk,
)

_DEFAULT_CLEARANCE_TEMPLATE = "{CALLSIGN}, {ATC_STATION}, good day. Startup approved. Information {ATIS} correct. Cleared {DESTINATION} via {ROUTE}, runway {RUNWAY}. Initial climb FT{INITIAL_ALT}. Squawk {SQUAWK}."
_PUBLIC_DOC_KEYS = {"privacy_terms", "changelog", "credits", "support"}


def _resolve_current_user_id():
    user = session.get("user") or {}
    discord_id = user.get("discord_id")
    if discord_id:
        try:
            resp = supabase.from_("discord_users").select("id").eq("discord_id", discord_id).execute()
            rows = resp.data or []
            if rows and rows[0].get("id"):
                return rows[0]["id"]
        except Exception:
            pass
    return user.get("id")


def _normalize_route(route):
    normalized = str(route or "").strip()
    if not normalized or normalized.upper() in {"N/A", "NA", "NONE"}:
        return "as filed"
    return normalized


def _format_flight_level(flight_level):
    normalized = str(flight_level or "").strip()
    if not normalized:
        return "XXX"
    if normalized.isdigit() and len(normalized) == 3:
        return normalized
    if normalized.isdigit() and int(normalized) > 999:
        return str(int(normalized) // 100).zfill(3)
    return normalized


def _apply_template(template, replacements):
    output = template
    for token, value in replacements.items():
        output = output.replace(f"{{{token}}}", value or "")
    return output.strip()


def _count_by_date(rows, key="created_at"):
    counts = {}
    for row in rows:
        ts = row.get(key)
        if not ts:
            continue
        day = str(ts)[:10]
        counts[day] = counts.get(day, 0) + 1
    return counts


def _sum_days(counts, n):
    today = date.today()
    return sum(counts.get((today - timedelta(days=i)).isoformat(), 0) for i in range(n - 1, -1, -1))


def _trend_pct(current, previous):
    if not previous:
        return None
    value = ((current - previous) / previous) * 100
    return round(value, 1) if value == value else None


def _daily_series(counts, cumulative=False):
    if not counts:
        return []
    start = date.fromisoformat(min(counts.keys()))
    end = date.today()
    out = []
    running = 0
    current = start
    while current <= end:
        day = current.isoformat()
        daily = counts.get(day, 0)
        running += daily
        out.append({"date": day, "count": running if cumulative else daily})
        current += timedelta(days=1)
    return out


def _fetch_all_rows(table, columns="created_at", since=None):
    rows = []
    offset = 0
    batch_size = 1000
    while True:
        query = supabase.from_(table).select(columns).range(offset, offset + batch_size - 1)
        if since:
            query = query.gte("created_at", since)
        batch = (query.execute().data or [])
        rows.extend(batch)
        if len(batch) < batch_size:
            break
        offset += batch_size
    return rows


def health_check():
    try:
        relay = get_health()
    except Exception:
        relay = None
    return jsonify({"status": "ok", "relay": relay})


def fetch_controllers():
    try:
        return jsonify(get_controllers())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def fetch_atis():
    try:
        return jsonify(get_atis())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def fetch_flight_plans():
    event = request.args.get("event", "false").lower() in ("1", "true", "yes")
    try:
        return jsonify(get_flight_plans(event=event))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_leaderboard_details():
    try:
        response = supabase.rpc("get_leaderboard_details", {"p_limit": 10}).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_user_clearances():
    if "user" not in session:
        return jsonify([])
    user_id = _resolve_current_user_id()
    if not user_id:
        return jsonify([])
    try:
        response = supabase.rpc("get_user_clearances", {"p_user_id": user_id}).execute()
        return jsonify(response.data or [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def generate_clearance():
    payload = request.get_json(silent=True) or {}
    callsign = str(payload.get("callsign") or "").strip()
    template = str(payload.get("template") or _DEFAULT_CLEARANCE_TEMPLATE)
    event = bool(payload.get("event", False))
    if not callsign:
        return jsonify({"error": "callsign is required"}), 400
    flight_plan = search_flight_plan(callsign, event=event)
    if not flight_plan:
        return jsonify({"error": "Flight plan not found"}), 404
    departure = str(flight_plan.get("departing", "")).strip().upper()
    destination = str(flight_plan.get("arriving", "")).strip().upper()
    plan_callsign = str(flight_plan.get("realcallsign") or flight_plan.get("callsign") or "").strip().upper()
    route = _normalize_route(flight_plan.get("route"))
    flight_level = _format_flight_level(flight_plan.get("flightlevel"))
    aircraft = str(flight_plan.get("aircraft", "")).strip()
    flight_rules = str(flight_plan.get("flightrules", "")).strip().upper()
    controller_info = resolve_controller_for_airport(departure)
    atc_station = controller_info["atc_station"]
    atis_info = resolve_atis_for_airport(departure)
    atis_letter = atis_info["atis"]
    runway = atis_info["runway"]
    squawk = generate_squawk()
    clearance = _apply_template(template, {
        "CALLSIGN": plan_callsign,
        "ATC_STATION": atc_station,
        "ATIS": atis_letter,
        "DESTINATION": destination,
        "ROUTE": route,
        "RUNWAY": runway,
        "INITIAL_ALT": "3000",
        "FLIGHT_LEVEL": flight_level,
        "SQUAWK": squawk,
    })
    try:
        user_id = _resolve_current_user_id()
        supabase.from_("clearance_generations").insert({
            "user_id": user_id,
            "discord_username": session.get("user", {}).get("username"),
            "clearance_text": clearance,
            "callsign": callsign,
            "destination": destination,
        }).execute()
    except Exception:
        pass
    return jsonify({
        "clearance": clearance,
        "squawk": squawk,
        "callsign": plan_callsign,
        "destination": destination,
        "departure": departure,
        "aircraft": aircraft,
        "flight_rules": flight_rules,
        "flight_level": flight_level,
        "atis": atis_letter,
        "atc_station": atc_station,
    })


def search_flight_plan_route():
    callsign = request.args.get("callsign", "").strip()
    if not callsign:
        return jsonify({"error": "callsign is required"}), 400
    plan = search_flight_plan(callsign, event=False)
    if not plan:
        return jsonify({"error": "Flight plan not found"}), 404
    return jsonify(plan)


def track_clearance_generation():
    payload = request.get_json(silent=True) or {}
    user_id = _resolve_current_user_id()
    clearance_text = str(payload.get("clearance_text") or payload.get("clearance") or "").strip()
    callsign = str(payload.get("callsign") or "").strip()
    destination = str(payload.get("destination") or "").strip()
    if not clearance_text or not callsign:
        return jsonify({"error": "clearance_text and callsign are required"}), 400
    try:
        supabase.from_("clearance_generations").insert({
            "user_id": user_id,
            "discord_username": session.get("user", {}).get("username"),
            "clearance_text": clearance_text,
            "callsign": callsign,
            "destination": destination,
        }).execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def load_public_documents():
    try:
        resp = supabase.from_("site_documents").select("*").execute()
        documents = [doc for doc in (resp.data or []) if doc.get("doc_key") in _PUBLIC_DOC_KEYS]
        return jsonify({"documents": documents})
    except Exception:
        return jsonify({"documents": []})


def load_admin_documents():
    try:
        resp = supabase.from_("site_documents").select("*").execute()
        return jsonify({"documents": resp.data or []})
    except Exception:
        return jsonify({"documents": []})


def save_admin_document(doc_key):
    payload = request.get_json(silent=True) or {}
    title = str(payload.get("title") or "").strip()
    content_md = str(payload.get("content_md") or "")
    if not title:
        return jsonify({"error": "title is required"}), 400
    try:
        supabase.from_("site_documents").upsert({
            "doc_key": doc_key,
            "title": title,
            "content_md": content_md,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }, on_conflict="doc_key").execute()
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def load_admin_analytics_overview():
    try:
        clearance_rows = _fetch_all_rows("clearance_generations", "created_at")
        clearance_counts = _count_by_date(clearance_rows)
        clearance_series = _daily_series(clearance_counts, cumulative=False)

        try:
            user_rows = supabase.rpc("get_admin_users").execute().data or []
        except Exception:
            user_rows = _fetch_all_rows("discord_users", "created_at")

        user_counts = _count_by_date(user_rows)
        user_growth_series = _daily_series(user_counts, cumulative=True)

        today_key = date.today().isoformat()
        yesterday_key = (date.today() - timedelta(days=1)).isoformat()

        total_clearances = sum(clearance_counts.values())
        today_clearances = clearance_counts.get(today_key, 0)
        last7 = _sum_days(clearance_counts, 7)
        last30 = _sum_days(clearance_counts, 30)
        total_users = user_growth_series[-1]["count"] if user_growth_series else 0
        previous7 = _sum_days(clearance_counts, 14) - last7
        previous30 = _sum_days(clearance_counts, 60) - last30
        previous_today = clearance_counts.get(yesterday_key, 0)
        previous_users = user_growth_series[-31]["count"] if len(user_growth_series) > 30 else 0

        payload = {
            "metrics": {
                "total_clearances": total_clearances,
                "today_clearances": today_clearances,
                "last7_clearances": last7,
                "last30_clearances": last30,
                "total_users": total_users,
                "trends": {
                    "today_clearances": _trend_pct(today_clearances, previous_today),
                    "last7_clearances": _trend_pct(last7, previous7),
                    "last30_clearances": _trend_pct(last30, previous30),
                    "total_users": _trend_pct(total_users, previous_users),
                },
            },
            "charts": {
                "clearances_per_day": clearance_series[-30:],
                "user_growth": user_growth_series,
            },
        }
        return jsonify(payload)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def load_admin_user_growth():
    try:
        days_raw = request.args.get("days", "30")
        all_time = request.args.get("all", "false").lower() in ("1", "true", "yes")
        try:
            days = int(days_raw)
            if days < 1 or days > 3650:
                raise ValueError
        except ValueError:
            return jsonify({"error": "days must be an integer between 1 and 3650"}), 400
        try:
            rows = supabase.rpc("get_admin_users").execute().data or []
        except Exception:
            since = None if all_time else (date.today() - timedelta(days=days - 1)).isoformat()
            rows = _fetch_all_rows("discord_users", "created_at", since=since)
        counts = _count_by_date(rows)
        out = []
        today = date.today()
        cum = 0
        if all_time:
            for d in sorted(counts.keys()):
                cum += counts[d]
                out.append({"date": d, "count": cum})
        else:
            for i in range(days - 1, -1, -1):
                d = (today - timedelta(days=i)).isoformat()
                cum += counts.get(d, 0)
                out.append({"date": d, "count": cum})
        return jsonify(out)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
