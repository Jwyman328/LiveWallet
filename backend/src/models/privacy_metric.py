from sqlalchemy import String, Enum, Integer
from enum import Enum as PyEnum


from src.database import DB


class PrivacyMetricName(str, PyEnum):
    # Minize personal information # TODO find better catagory name
    ANNOMINITY_SET = "annominity set"
    NO_ADDRESS_REUSE = "no address reuse"
    MINIMAL_WEALTH_REVEAL = "minimal wealth reveal"
    MINIMAL_TX_HISTORY_REVEAL = "minimal transaction history reveal"

    # Minimize linkability of inputs and outputs through change detection.
    NO_CHANGE = "no change"
    NO_SMALL_CHANGE = "no small change"
    NO_ROUND_NUMBER_PAYMENTS = "no round number payments"
    SAME_SCRIPT_TYPES = "same script types"
    NO_UNNECESSARY_INPUT = "no unnecessary inputs"
    USE_MULTI_CHANGE_OUTPUTS = "multi change outputs"
    AVOID_COMMON_CHANGE_POSITION = "avoid common change position"

    # avoid combinding or using utxos that you do not want to be combined
    NO_DO_NOT_SPEND_UTXOS = "do not spend do not spends"
    NO_KYCED_UTXOS = "do not spend KYCED"

    # Add more labels as needed

    # TODO metrics
    # TIMING_ANALYSIS = "timing analysis"

    # NO_POST_MIX_CHANGE = "no post mix change"
    # SEGREGATE_POSTMIX_AND_NONMIX = "segregate postmix and nonmix"


privacy_metrics_descriptions = {
    PrivacyMetricName.ANNOMINITY_SET: "A high anonymity set improves Bitcoin privacy by obscuring transaction origins and preventing address linking, making it harder for blockchain analysis to identify specific users and enhancing overall confidentiality.",
    PrivacyMetricName.NO_ADDRESS_REUSE: "Not reusing addresses is good for privacy because it prevents transaction history from being easily linked to a single identity, making it more difficult for observers to trace user activity and associate multiple transactions with the same individual.",
    PrivacyMetricName.MINIMAL_WEALTH_REVEAL: "Avoiding the use of UTXOs with large amounts is beneficial for privacy because it minimizes the risk of revealing your wealth and financial habits, making it harder for observers to assess your overall financial status or target you for theft or scams. This practice helps maintain a lower profile in transactions, reducing the likelihood of being linked to a specific identity or wealth level.",
    PrivacyMetricName.MINIMAL_TX_HISTORY_REVEAL: "Avoiding the use of many UTXOs helps reduce the visibility of transaction history, as consolidating or minimizing UTXOs makes it harder for observers to track and link multiple transactions to a single identity. This practice enhances privacy by obscuring spending patterns and making it difficult to establish a comprehensive financial profile based on transaction behavior.",
    PrivacyMetricName.NO_CHANGE: "Having no change in a Bitcoin transaction improves privacy by simplifying the transaction structure, making it harder for external observers to trace the flow of funds and link addresses back to their owners. This reduces the potential for address clustering, where multiple addresses are associated with the same user, thereby enhancing anonymity in the transaction history.",
    PrivacyMetricName.NO_SMALL_CHANGE: "Avoiding small change in Bitcoin transactions enhances privacy by minimizing the number of unspent transaction outputs (UTXOs) associated with a user's wallet, which can be traced back to them. Small UTXOs often create identifiable patterns, revealing links between inputs and outputs, and making it easier for observers to track transaction histories and associate multiple addresses with a single user, thereby compromising anonymity.",
    PrivacyMetricName.NO_ROUND_NUMBER_PAYMENTS: "Using non-round number payments in Bitcoin transactions helps obscure the identities of both the sender and receiver by reducing the likelihood of identifying who is involved in a transaction. Round number payments can create clear patterns, making it easier for observers to pinpoint the receiver based on the expected amounts, while irregular payment amounts complicate this analysis, making it difficult to discern the relationship between the parties and enhancing privacy for both.",
    PrivacyMetricName.SAME_SCRIPT_TYPES: "Maintaining the same script type between inputs and outputs in a Bitcoin transaction enhances privacy by ensuring that all elements of the transaction appear uniform and consistent, making it more challenging for observers to draw conclusions about the transaction's structure. When inputs and outputs share the same script type, it becomes harder to differentiate between them, thereby obscuring the flow of funds and reducing the potential for address clustering, which can lead to a clearer association between addresses and their owners.",
    PrivacyMetricName.NO_UNNECESSARY_INPUT: "Reducing unnecessary inputs in a Bitcoin transaction is beneficial because it prevents the association of specific inputs with outputs, making it harder to trace the flow of funds. ",
    PrivacyMetricName.USE_MULTI_CHANGE_OUTPUTS: "Having multiple outputs in a Bitcoin transaction enhances privacy by creating a more complex transaction structure, which obscures the relationship between inputs and outputs. This added complexity makes it difficult for observers to trace the flow of funds, thereby reducing the risk of linking specific inputs to identifiable outputs.",
    PrivacyMetricName.AVOID_COMMON_CHANGE_POSITION: "Reusing the same change output (vout) position in Bitcoin transactions can lead to wallet clustering, where observers can group multiple addresses controlled by the same user based on transaction patterns. This compromises your privacy by making it easier to trace your spending behavior and link different transactions.",
    PrivacyMetricName.NO_DO_NOT_SPEND_UTXOS: "Avoiding the use of 'do not spend' UTXOs in Bitcoin transactions is essential for maintaining privacy and security, as these UTXOs are typically flagged for specific purposes and should not be combined with other funds. By avoiding these UTXOs, you can prevent unintended disclosures of sensitive information and protect your financial privacy.",
    PrivacyMetricName.NO_KYCED_UTXOS: "Avoiding the use of KYCed UTXOs in Bitcoin transactions is crucial for preserving privacy and anonymity, as these UTXOs are linked to your identity through Know Your Customer (KYC) processes. By excluding these UTXOs from your transactions, you can prevent the exposure of personal information and maintain a higher level of privacy and confidentiality.",
}


# TODO metrics
# PrivacyMetricName.TIMING_ANALYSIS: "Avoiding timing analysis in a Bitcoin transaction enhances privacy by obscuring the relationship between senders and receivers, making it harder for observers to link transactions to specific individuals. By randomizing transaction timing or using methods like coin mixing, users can protect their financial patterns and enhance overall anonymity within the network.",


#     PrivacyMetricName.NO_POST_MIX_CHANGE: "Not using post mix change ensures that funds remain anonymized after mixing, preventing the re-identification of mixed funds and maintaining the privacy and anonymity provided by the mixing process. ",
#     PrivacyMetricName.SEGREGATE_POSTMIX_AND_NONMIX: "Segregating post-mix and non-mix funds in Bitcoin transactions is essential for maintaining privacy and anonymity, as combining these funds can undo the anonymization that the mixing provided.",
# #
# #


class PrivacyMetric(DB.Model):
    __tablename__ = "privacy_metrics"  # Specify the table name

    id = DB.Column(Integer, primary_key=True, autoincrement=True)
    name = DB.Column(Enum(PrivacyMetricName), unique=True, nullable=False)
    display_name = DB.Column(String, unique=True, nullable=False)
    description = DB.Column(String, unique=True, nullable=False)
