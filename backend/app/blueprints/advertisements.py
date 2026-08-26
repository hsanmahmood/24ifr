from flask import Blueprint, jsonify, request, current_app
from ..database import supabase
from ..security import require_csrf
from ..cache import ttl_cache
from .admin import require_admin

advertisements_bp = Blueprint('advertisements', __name__)

def validate_discord_invite(url):
    if not url:
        return False
    url = url.strip()
    return url.startswith('https://discord.gg/') or url.startswith('https://discord.com/invite/')

def validate_https_url(url):
    if not url:
        return True
    url = url.strip()
    return url.startswith('https://')

@advertisements_bp.route('/api/advertisement/active')
def get_active_advertisement():
    try:
        def build():
            resp = supabase.from_('advertisements').select('*').eq('is_active', True).limit(1).execute()
            rows = resp.data or []
            if not rows:
                return None
            row = rows[0]
            return {
                'id': row.get('id'),
                'server_name': row.get('server_name'),
                'invite_url': row.get('invite_url'),
                'icon_url': row.get('icon_url'),
                'description': row.get('description'),
                'message': row.get('message')
            }
        result = ttl_cache('active_advertisement', 60, build)
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch active advertisement: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch active advertisement"}), 500

@advertisements_bp.route('/api/admin/advertisements')
@require_admin
def list_advertisements():
    try:
        resp = supabase.from_('advertisements').select('*').order('created_at', desc=True).execute()
        return jsonify(resp.data or [])
    except Exception as e:
        current_app.logger.error(f"Failed to list advertisements: {e}", exc_info=True)
        return jsonify({"error": "Failed to list advertisements"}), 500

@advertisements_bp.route('/api/admin/advertisements', methods=['POST'])
@require_admin
@require_csrf
def create_advertisement():
    payload = request.get_json(silent=True) or {}
    server_name = str(payload.get('server_name') or '').strip()
    invite_url = str(payload.get('invite_url') or '').strip()
    icon_url = str(payload.get('icon_url') or '').strip() if payload.get('icon_url') else None
    description = str(payload.get('description') or '').strip() if payload.get('description') else None
    message = str(payload.get('message') or '').strip() if payload.get('message') else None

    if not server_name:
        return jsonify({"error": "server_name is required"}), 400
    if len(server_name) > 100:
        return jsonify({"error": "server_name must be 100 characters or less"}), 400
    if not invite_url:
        return jsonify({"error": "invite_url is required"}), 400
    if not validate_discord_invite(invite_url):
        return jsonify({"error": "invite_url must be a valid Discord invite URL"}), 400
    if icon_url and not validate_https_url(icon_url):
        return jsonify({"error": "icon_url must be a valid HTTPS URL"}), 400
    if description and len(description) > 500:
        return jsonify({"error": "description must be 500 characters or less"}), 400
    if message and len(message) > 500:
        return jsonify({"error": "message must be 500 characters or less"}), 400

    try:
        record = {
            'server_name': server_name,
            'invite_url': invite_url,
            'icon_url': icon_url if icon_url else None,
            'description': description if description else None,
            'message': message if message else None,
            'is_active': False
        }
        resp = supabase.from_('advertisements').insert(record).execute()
        return jsonify(resp.data[0] if resp.data else None), 201
    except Exception as e:
        current_app.logger.error(f"Failed to create advertisement: {e}", exc_info=True)
        return jsonify({"error": "Failed to create advertisement", "details": str(e)}), 500

@advertisements_bp.route('/api/admin/advertisements/<id>', methods=['PUT'])
@require_admin
@require_csrf
def update_advertisement(id):
    payload = request.get_json(silent=True) or {}
    server_name = str(payload.get('server_name') or '').strip() if payload.get('server_name') else None
    invite_url = str(payload.get('invite_url') or '').strip() if payload.get('invite_url') else None
    icon_url = str(payload.get('icon_url') or '').strip() if payload.get('icon_url') else None
    description = str(payload.get('description') or '').strip() if payload.get('description') else None
    message = str(payload.get('message') or '').strip() if payload.get('message') else None

    if server_name and len(server_name) > 100:
        return jsonify({"error": "server_name must be 100 characters or less"}), 400
    if invite_url and not validate_discord_invite(invite_url):
        return jsonify({"error": "invite_url must be a valid Discord invite URL"}), 400
    if icon_url and not validate_https_url(icon_url):
        return jsonify({"error": "icon_url must be a valid HTTPS URL"}), 400
    if description and len(description) > 500:
        return jsonify({"error": "description must be 500 characters or less"}), 400
    if message and len(message) > 500:
        return jsonify({"error": "message must be 500 characters or less"}), 400

    update_data = {}
    if server_name is not None:
        update_data['server_name'] = server_name
    if invite_url is not None:
        update_data['invite_url'] = invite_url
    if icon_url is not None:
        update_data['icon_url'] = icon_url if icon_url else None
    if description is not None:
        update_data['description'] = description if description else None
    if message is not None:
        update_data['message'] = message if message else None

    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400

    try:
        resp = supabase.from_('advertisements').update(update_data).eq('id', id).execute()
        if not resp.data:
            return jsonify({"error": "Advertisement not found"}), 404
        return jsonify(resp.data[0])
    except Exception as e:
        current_app.logger.error(f"Failed to update advertisement {id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to update advertisement", "details": str(e)}), 500

@advertisements_bp.route('/api/admin/advertisements/<id>', methods=['DELETE'])
@require_admin
@require_csrf
def delete_advertisement(id):
    try:
        check_resp = supabase.from_('advertisements').select('is_active').eq('id', id).execute()
        if not check_resp.data:
            return jsonify({"error": "Advertisement not found"}), 404
        if check_resp.data[0].get('is_active'):
            return jsonify({"error": "Cannot delete active advertisement. Deactivate it first."}), 409
        resp = supabase.from_('advertisements').delete().eq('id', id).execute()
        return jsonify({"success": True})
    except Exception as e:
        current_app.logger.error(f"Failed to delete advertisement {id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete advertisement", "details": str(e)}), 500

@advertisements_bp.route('/api/admin/advertisements/<id>/activate', methods=['POST'])
@require_admin
@require_csrf
def activate_advertisement(id):
    try:
        check_resp = supabase.from_('advertisements').select('id').eq('id', id).execute()
        if not check_resp.data:
            return jsonify({"error": "Advertisement not found"}), 404
        supabase.from_('advertisements').update({'is_active': False}).neq('id', id).execute()
        resp = supabase.from_('advertisements').update({'is_active': True}).eq('id', id).execute()
        return jsonify(resp.data[0] if resp.data else None)
    except Exception as e:
        current_app.logger.error(f"Failed to activate advertisement {id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to activate advertisement", "details": str(e)}), 500

@advertisements_bp.route('/api/admin/advertisements/<id>/deactivate', methods=['POST'])
@require_admin
@require_csrf
def deactivate_advertisement(id):
    try:
        check_resp = supabase.from_('advertisements').select('id').eq('id', id).execute()
        if not check_resp.data:
            return jsonify({"error": "Advertisement not found"}), 404
        resp = supabase.from_('advertisements').update({'is_active': False}).eq('id', id).execute()
        return jsonify({"success": True})
    except Exception as e:
        current_app.logger.error(f"Failed to deactivate advertisement {id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to deactivate advertisement", "details": str(e)}), 500
