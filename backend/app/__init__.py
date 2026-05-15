from flask import Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from .core.config import Config
from .routes.auth import auth_bp
from .routes.api import api_bp
from .routes.admin import admin_bp
from .services import relay_service

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['SESSION_COOKIE_NAME'] = 'session_id'
    
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    CORS(app, supports_credentials=True)
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)
    app.register_blueprint(admin_bp)
    
    @app.route('/')
    def status():
        return 'OK-RESTARTED'
    
    @app.route('/debug/routes')
    def list_routes():
        import urllib
        output = []
        for rule in app.url_map.iter_rules():
            methods = ','.join(rule.methods)
            line = urllib.parse.unquote(f"{rule.endpoint:50s} {methods:20s} {rule}")
            output.append(line)
        return '<pre>' + '\n'.join(sorted(output)) + '</pre>'
    
    # relay_service.start_cache_daemon(app)
    
    return app
