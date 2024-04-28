from flask import Flask, request
from flask_cors import CORS

# initialize structlog
from src.utils import logging  # noqa: F401, E261

import structlog

LOGGER = structlog.get_logger()


class AppCreator:
    app = None

    @classmethod
    def create_app(cls) -> Flask:
        from src.views import balance_page, utxo_page, fees_api, wallet_api
        from src.containers.service_container import ServiceContainer
        from src.containers.global_data_store_container import GlobalStoreContainer

        if cls.app is not None:
            return cls.app
        else:
            container = ServiceContainer()
            data_container = GlobalStoreContainer()
            cls.app = Flask(__name__)
            CORS(
                cls.app,
                resources={r"/*": {"origins": "*"}},
                methods=["GET", "POST"],
                allow_headers=["Content-Type"],
            )

            cls.app.container = container
            cls.app.data_container = data_container
            cls.app.register_blueprint(balance_page)
            cls.app.register_blueprint(utxo_page)
            cls.app.register_blueprint(fees_api)
            cls.app.register_blueprint(wallet_api)

            return cls.app


def create_app() -> Flask:
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


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5011)
