from flask import Flask, request
from flask_cors import CORS
from src.database import DB

# initialize structlog
from src.utils import logging  # noqa: F401, E261

import structlog

LOGGER = structlog.get_logger()


class AppCreator:
    app = None

    @classmethod
    def create_app(cls) -> Flask:
        from src.views import (
            balance_page,
            utxo_page,
            fees_api,
            wallet_api,
            health_check_api,
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
            # cls.app.data_container = data_container
            cls.app.register_blueprint(balance_page)
            cls.app.register_blueprint(utxo_page)
            cls.app.register_blueprint(fees_api)
            cls.app.register_blueprint(wallet_api)
            cls.app.register_blueprint(health_check_api)

            return cls.app


def create_app(*args, **kwargs) -> Flask:
    """Initiated the flask app and add pre and post request processing middleware logging functions."""
    app = AppCreator.create_app()
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


# if __name__ == "__main__":
#     app = create_app()
#     app.run(host="127.0.0.1", port=5011, debug=True)
# else:
#     app = create_app()


# TODO make debug=True when we are developing
if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5011, debug=False)
else:
    app = create_app()
    app.run(host="127.0.0.1", port=5011, debug=False)
