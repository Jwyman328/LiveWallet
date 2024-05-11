from typing import Optional
from bdkpython import bdk
import structlog
from src.types.wallet import WalletDetails

LOGGER = structlog.get_logger()


class GlobalDataStore:
    def __init__(
        self,
        descriptor: Optional[str] = None,
        network: bdk.Network = bdk.Network.TESTNET,
        electrum_url="127.0.0.1:50000",
        wallet: Optional[bdk.Wallet] = None,
    ):
        self.wallet_details = WalletDetails(
            descriptor=descriptor, network=network, electrum_url=electrum_url
        )

        self.wallet = wallet

    def set_global_descriptor(
        self,
        descriptor: str,
    ) -> str:
        """Set the flask app level global wallet_descriptor."""

        self.wallet_details.descriptor = descriptor
        LOGGER.info("Global wallet descriptor set", descriptor=descriptor)

        return descriptor

    def set_global_network(self, network: str) -> bdk.Network:
        """Set the flask app level global network for the underlying wallet"""
        bdk_network: bdk.Network = bdk.Network.__members__[network]
        self.wallet_details.network = bdk_network

        LOGGER.info("Global wallet network set", network=bdk_network)

        return bdk_network

    def set_global_electrum_url(self, electrum_url: str):
        """Set the flask app level global electrum url for the underlying wallet to access"""
        self.wallet_details.electrum_url = electrum_url
        return electrum_url

    def set_global_wallet(self, wallet: bdk.Wallet):
        """Set the flask app level global electrum url for the underlying wallet to access"""
        self.wallet = wallet

        LOGGER.info("Current wallet and details successfully added to the global data store")
        return wallet

    def remove_global_wallet_and_details(self):
        """Remove the global wallet and related details from the global data store"""
        self.wallet_details = WalletDetails(None, None, None)
        self.wallet = None

        LOGGER.info("Current wallet and details successfully removed from the global data store")
        return None
