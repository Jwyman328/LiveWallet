from dependency_injector import containers, providers

from src.services.privacy_metrics.privacy_metrics import PrivacyMetricsService


class ServiceContainer(containers.DeclarativeContainer):
    from src.services import WalletService, FeeService, HardwareWalletService

    wiring_config = containers.WiringConfiguration(
        packages=["..controllers", "..services"]
    )

    wallet_service = providers.Factory(WalletService)
    hardware_wallet_service = providers.Singleton(HardwareWalletService)
    fee_service = providers.Factory(FeeService)
    privacy_metrics_service = providers.Factory(PrivacyMetricsService)
