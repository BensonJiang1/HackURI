"""Flask application factory."""

from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    # Allow cross-origin requests in development (frontend demo, Next.js, etc.)
    CORS(app)

    # Register blueprints
    from app.routes.geocode import geocode_bp
    from app.routes.routing import routing_bp
    from app.routes.amenities import amenities_bp
    from app.routes.score import score_bp

    app.register_blueprint(geocode_bp, url_prefix="/api/geocode")
    app.register_blueprint(routing_bp, url_prefix="/api/route")
    app.register_blueprint(amenities_bp, url_prefix="/api/amenities")
    app.register_blueprint(score_bp, url_prefix="/api/score")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app
