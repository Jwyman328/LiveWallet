from dependency_injector import containers, providers


class GlobalStoreContainer(containers.DeclarativeContainer):
    from src.services import GlobalDataStore

    wiring_config = containers.WiringConfiguration(
        packages=["..views", "..services"], modules=["src.services.wallet.wallet"]
    )

    global_data_store = providers.Singleton(GlobalDataStore)
