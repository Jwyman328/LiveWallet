from unittest import TestCase
from src.services.global_data_store.global_data_store import GlobalDataStore
from bdkpython import bdk
from src.types.wallet import WalletDetails


class TestGlobalDataStoreService(TestCase):
    def test_global_data_store_initiate(self):
        instance = GlobalDataStore(
            "mock_descriptor", bdk.Network.REGTEST, "mock_url")

        expected_wallet_details = WalletDetails(
            "mock_descriptor", bdk.Network.REGTEST, "mock_url"
        )

        assert instance.wallet_details.network == expected_wallet_details.network
        assert instance.wallet_details.descriptor == expected_wallet_details.descriptor
        assert (
            instance.wallet_details.electrum_url == expected_wallet_details.electrum_url
        )

    def test_set_global_descriptor(self):
        instance = GlobalDataStore(
            "mock_descriptor", bdk.Network.REGTEST, "mock_url")
        instance.set_global_descriptor("new descriptor 123")

        assert instance.wallet_details.descriptor == "new descriptor 123"

    def test_set_global_network(self):
        instance = GlobalDataStore(
            "mock_descriptor", bdk.Network.REGTEST, "mock_url")
        instance.set_global_network("TESTNET")

        assert instance.wallet_details.network == bdk.Network.TESTNET

    def test_set_global_electrum_url(self):
        instance = GlobalDataStore(
            "mock_descriptor", bdk.Network.REGTEST, "mock_url")
        instance.set_global_electrum_url("new local host url")

        assert instance.wallet_details.electrum_url == "new local host url"
