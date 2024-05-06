from flask import Blueprint
import structlog

LOGGER = structlog.get_logger()

health_check_api = Blueprint(
    "health-check", __name__, url_prefix="/health-check")


@health_check_api.route(
    "/status",
)
def get_health_check_status():
    """Check the health of the server"""
    try:
        LOGGER.info("Checking health of server")
        return {"status": "good"}
    except Exception as e:
        LOGGER.error("Error checking health status", error=e)
        return {"status": "bad"}
