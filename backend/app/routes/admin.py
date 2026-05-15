from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, current_app
from .auth import require_auth
from ..database import supabase
from ..utils.responses import success_response, error_response

admin_bp = Blueprint('admin', __name__)
DOC_KEYS = {'privacy_terms', 'credits', 'support', 'changelog'}

@admin_bp.route('/api/admin/documents')
@require_auth(role='admin')
def get_documents():
    resp = supabase.from_('site_documents').select('*').in_('doc_key', list(DOC_KEYS)).execute()
    rows = resp.data or []
    mapped = {row['doc_key']: row for row in rows}
    
    docs = []
    for key in ['privacy_terms', 'credits', 'support', 'changelog']:
        row = mapped.get(key)
        docs.append({
            'doc_key': key,
            'title': (row or {}).get('title') or key.replace('_', ' ').title(),
            'content_md': (row or {}).get('content_md') or '',
            'updated_at': (row or {}).get('updated_at'),
        })
    return success_response(data={'documents': docs})

@admin_bp.route('/api/admin/documents/<doc_key>', methods=['PUT'])
@require_auth(role='admin')
def update_document(doc_key):
    if doc_key not in DOC_KEYS:
        return error_response("Invalid document key")

    payload = request.get_json(silent=True) or {}
    title = str(payload.get('title') or '').strip()
    if not title:
        return error_response("Title required")

    resp = supabase.from_('site_documents').upsert({
        'doc_key': doc_key,
        'title': title,
        'content_md': str(payload.get('content_md') or ''),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }, on_conflict='doc_key').execute()
    
    return success_response(data={'document': resp.data[0]})

@admin_bp.route('/api/admin/clearances/daily')
@require_auth(role='admin')
def daily_clearances():
    days = max(1, min(request.args.get('days', default=14, type=int), 90))
    start = datetime.now(timezone.utc).date() - timedelta(days=days - 1)
    
    resp = supabase.from_('clearance_generations').select('created_at').gte('created_at', f"{start.isoformat()}T00:00:00+00:00").execute()
    
    counts = {}
    for row in resp.data or []:
        day = datetime.fromisoformat(row['created_at'].replace('Z', '+00:00')).date().isoformat()
        counts[day] = counts.get(day, 0) + 1
        
    series = []
    for i in range(days):
        day = (start + timedelta(days=i)).isoformat()
        series.append({'date': day, 'count': counts.get(day, 0)})
        
    return success_response(data={'series': series})
