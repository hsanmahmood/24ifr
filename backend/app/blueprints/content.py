from flask import Blueprint, jsonify, request, session, current_app
from ..database import supabase
from ..clearance_service import resolve_current_discord_user_id
from ..security import require_csrf
from ..cache import ttl_cache

content_bp = Blueprint('content', __name__)

@content_bp.route('/api/leaderboard/details')
def get_leaderboard_details():
    try:
        response = supabase.rpc('get_leaderboard_details', {'p_limit': 10}).execute()
        return jsonify(response.data)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch leaderboard details from Supabase: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch leaderboard details", "details": str(e)}), 500

@content_bp.route('/api/user/clearances')
def get_user_clearances():
    try:
        if 'user' not in session:
            return jsonify([])
        user_id = resolve_current_discord_user_id()
        if not user_id:
            return jsonify([])
        response = supabase.rpc('get_user_clearances', {'p_user_id': user_id}).execute()
        return jsonify(response.data or [])
    except Exception as e:
        current_app.logger.error(f"Failed to fetch user clearances from Supabase: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch user clearances", "details": str(e)}), 500

@content_bp.route('/api/public/documents')
def load_public_documents():
    allowed_keys = {'privacy_terms', 'changelog', 'credits', 'support'}
    try:
        def build():
            documents = supabase.from_('site_documents').select('*').execute().data or []
            return [doc for doc in documents if doc.get('doc_key') in allowed_keys]
        filtered = ttl_cache('public_documents', 300, build)
        return jsonify({"documents": filtered})
    except Exception as e:
        current_app.logger.warning(f"Exception fetching public documents: {e}", exc_info=True)
        return jsonify({"documents": []})

@content_bp.route('/api/feedback/active')
def get_active_feedback_prompt():
    try:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        resp = supabase.from_("feedback_prompts").select("*").gt("expires_at", now).order("created_at", desc=True).limit(1).execute()
        rows = resp.data or []
        return jsonify(rows[0] if rows else None)
    except Exception as e:
        current_app.logger.error(f"Failed to fetch active feedback prompt: {e}", exc_info=True)
        return jsonify({"error": "Failed to fetch active feedback prompt"}), 500

@content_bp.route('/api/feedback', methods=['POST'])
@require_csrf
def submit_feedback():
    payload = request.get_json(silent=True) or {}
    message = payload.get("message")
    prompt_id = payload.get("prompt_id")
    rating = payload.get("rating")

    if not message or not str(message).strip():
        return jsonify({"error": "message is required"}), 400

    user_id = None
    discord_username = None
    if "user" in session:
        user_id = resolve_current_discord_user_id()
        discord_username = session.get("user", {}).get("username")

    try:
        record = {
            "message": message,
            "prompt_id": prompt_id,
            "rating": rating,
            "user_id": user_id,
            "discord_username": discord_username,
        }
        supabase.from_("feedback").insert(record).execute()
        return jsonify({"success": True})
    except Exception as e:
        current_app.logger.error(f"Failed to submit feedback: {e}", exc_info=True)
        return jsonify({"error": "Failed to submit feedback", "details": str(e)}), 500