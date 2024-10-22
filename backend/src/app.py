from flask import Flask, request
from flask_cors import CORS
from src.database import DB, populate_labels

# initialize structlog
from src.utils import logging  # noqa: F401, E261

import structlog
from os import environ

LOGGER = structlog.get_logger()


class AppCreator:
    app = None

    @classmethod
    def create_app(cls) -> Flask:
        from src.controllers import (
            balance_page,
            utxo_page,
            transactions_page,
            fees_api,
            wallet_api,
            health_check_api,
            hardware_wallet_api,
        )
        from src.containers.service_container import ServiceContainer

        if cls.app is not None:
            return cls.app
        else:
            cls.app = Flask(__name__)

            setup_database(cls.app)

            CORS(
                cls.app,
                resources={r"/*": {"origins": "*"}},
                methods=["GET", "POST", "DELETE"],
                allow_headers=["Content-Type"],
            )

            container = ServiceContainer()

            cls.app.container = container
            cls.app.register_blueprint(balance_page)
            cls.app.register_blueprint(utxo_page)
            cls.app.register_blueprint(transactions_page)
            cls.app.register_blueprint(fees_api)
            cls.app.register_blueprint(wallet_api)
            cls.app.register_blueprint(health_check_api)
            cls.app.register_blueprint(hardware_wallet_api)

            return cls.app


def create_app(*args, **kwargs) -> Flask:
    """Initiated the flask app and add pre and post request processing middleware logging functions."""
    app = AppCreator.create_app()

    # the production app can't pass an env variable so set the default
    # to production if no env variable is set.
    app.config["ENVIRONMENT"] = environ.get("ENVIRONMENT", "PRODUCTION")
    # Set a secret key for the application

    @app.before_request
    def log_request_info():
        LOGGER.info(
            "Request started",
            path=request.path,
            method=request.method,
            args=request.args,
            body=request.data,
        )

    @app.after_request
    def log_response_info(response):
        LOGGER.info(
            "Request completed",
            path=request.path,
            method=request.method,
            status_code=response.status_code,
        )
        return response

    return app


def setup_database(app):
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///global_data_store.db"
    # Disable modification tracking
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    DB.init_app(app)
    with app.app_context():
        DB.create_all()
        populate_labels()


# for some reason the frontend doesn't run the executable with app.y being __main__
if __name__ == "__main__":
    app = create_app()
    is_development = app.config["ENVIRONMENT"] == "DEVELOPMENT"
    is_testing = app.config["ENVIRONMENT"] == "TESTING"

    if is_testing is False:
        # hwi will fail on macos unless it is run in a single thread, threrefore set threaded to False
        app.run(host="127.0.0.1", port=5011, debug=is_development, threaded=False)
else:
    # this will run when the app is run from the generated executable
    # which is done in the production app.

    app = create_app()

    is_development = app.config["ENVIRONMENT"] == "DEVELOPMENT"
    is_testing = app.config["ENVIRONMENT"] == "TESTING"
    is_production = app.config["ENVIRONMENT"] == "PRODUCTION"
    # only app.run if this is being run from production, it is possible
    # this is imported from another file, in which case we don't want to run the app.
    if is_production:
        # hwi will fail on macos unless it is run in a single thread, threrefore set threaded to False
        app.run(host="127.0.0.1", port=5011, debug=False, threaded=False)
