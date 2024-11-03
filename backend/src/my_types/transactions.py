from typing import List, Any, Optional
from bitcoinlib.transactions import Output


class LiveWalletOutput(Output):
    """
    A bitcoin output which extendes the bitcoinlib Output and adds additional
    fields unique to live wallet, like annominity_set, txid and labels.
    """

    def __init__(
        self,
        annominity_set: int = 1,
        txid: Optional[str] = None,
        base_output: Optional[Output] = None,
        labels: Optional[List[str]] = None,
    ):
        if labels is None:
            labels = []

        for key, value in vars(base_output).items():
            setattr(self, key, value)  # Set each attribute in the subclass
        self.annominity_set = annominity_set
        self.txid = txid
        self.labels = labels

    def as_dict(self) -> dict[str, Any]:
        # Get the dictionary from the base class
        base_dict = super().as_dict()

        # Add additional features to the dictionary
        base_dict["annominity_set"] = self.annominity_set
        base_dict["txid"] = self.txid
        base_dict["labels"] = self.labels
        return base_dict
