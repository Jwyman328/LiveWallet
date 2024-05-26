from dependency_injector import containers, providers


class ServiceContainer(containers.DeclarativeContainer):
    from src.services import WalletService, FeeService

    wiring_config = containers.WiringConfiguration(packages=["..views", "..services"])

    wallet_service = providers.Factory(WalletService)
    fee_service = providers.Factory(FeeService)
