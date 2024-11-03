export type GetUtxosResponseType = {
  utxos: Utxo[];
};

export type UtxoRequestParam = {
  id: string;
  vout: number;
};

export type UtxoRequestParamWithAmount = {
  id: string;
  vout: number;
  amount: number;
};

export type Utxo = {
  amount: number;
  txid: string;
  vout: number;
};

export type GetBalanceResponseType = {
  confirmed: number;
  spendable: number;
  total: number;
};

export type CurrentFeesResponseType = {
  low: number;
  medium: number;
  high: number;
};

export type CreateTxFeeEstimationResponseType = {
  spendable: boolean;
  fee: number;
  psbt?: string; // base64 of psbt
};

export type InitiateWalletResponseType = {
  message: string;
  descriptor: string;
  network: string;
  electrumUrl: string;
};

export type CreateMockWalletResponseType = {
  message: string;
  descriptor: string;
  network: string;
};

export type DeleteCurrentWalletResponseType = {
  message: string;
};

export type HealthStatusResponseType = {
  status: 'good' | 'bad';
};

export type HardwareWalletDetails = {
  id: string;
  path?: string;
  label: string;
  type?: string;
  model: string;
  needs_pin_sent: boolean;
  needs_passphrase_sent: boolean;
  fingerprint?: string;
};

export type HardwareWalletsResponseType = {
  wallets: [HardwareWalletDetails];
};

export type HardwareWalletPromptToUnlockResponseType = {
  was_prompt_successful: boolean;
};

export type HardwareWalletUnlockResponseType = {
  was_unlock_successful: boolean;
};

export type HardwareWalletXpubResponseType = {
  xpub: string;
};

export type HardwareWalletSetPassphraseResponseType = {
  was_passphrase_set: boolean;
};

export type HardwareWalletCloseAndRemoveResponseType = {
  was_close_and_remove_successful: boolean;
};

export type GetBTCPriceResponseType = {
  time: number;
  USD: number;
  EUR: number;
  GBP: number;
  CAD: number;
  CHF: number;
  AUD: number;
  JPY: number;
};

export type TransactionInputType = {
  index_n: number;
  prev_txid: string;
  output_n: number;
  script_type: string; // e.g., "sig_pubkey"
  address: string;
  value: number;
  public_keys: string;
  compressed: boolean;
  encoding: string; // e.g., "bech32"
  double_spend: boolean;
  script: string; // can be an empty string
  redeemscript: string;
  sequence: number;
  signatures: string[];
  sigs_required: number;
  locktime_cltv?: string | number;
  locktime_csv?: string | number;
  public_hash: string;
  script_code: string;
  unlocking_script: string;
  unlocking_script_unsigned: string;
  witness_type: string; // e.g., "segwit"
  witness?: string;
  sort: boolean;
  valid?: boolean;
};

export type TransactionOutputType = {
  value: number; // in sats
  script: string;
  script_type: string; // e.g., "p2wpkh"
  public_key: string;
  public_hash: string;
  address: string;
  output_n: number;
  spent: boolean;
  spending_txid: string;
  spending_index_n?: number;
  txid: string;
  annominity_set: number;
  labels: string[];
};

export type OutputLabelType = {
  label: string;
  display_name: string;
  description: string;
};
export type GetOutputLabelsResponseType = {
  labels: [OutputLabelType];
};
export type GetOutputLabelsPopulateResponseType = {
  [key: string]: OutputLabelType;
};
export type PopulateOutputLabelsBodyType = {
  [key: string]: OutputLabelType;
};

export type PopulateOutputLabelsResponse = {
  success: boolean;
};
export type Transaction = {
  txid: string;
  date?: string;
  network: string; // e.g., "bitcoin"
  witness_type: string; // e.g., "segwit"
  coinbase: boolean;
  flag: number;
  txhash: string;
  confirmations?: number;
  block_height?: number;
  block_hash?: string;
  fee?: number;
  fee_per_kb?: number;
  inputs: TransactionInputType[];
  outputs: TransactionOutputType[];
  input_total: number;
  output_total: number;
  version: number;
  locktime: number;
  raw: string;
  size: number;
  vsize: number;
  verified: boolean;
  status: string; // e.g., "new"
};
export type GetTransactionsResponseType = { transactions: [Transaction] };

export type GetOutputsResponseType = {
  outputs: TransactionOutputType[];
};

export type AddLabelRequestBody = {
  txid: string;
  vout: number;
  labelName: string;
};

export type AddLabelResponseType = {
  labels: [OutputLabelType];
};

export type RemoveLabelRequestParams = {
  txid: string;
  vout: number;
  labelName: string;
};

export type RemoveLabelResponseType = {
  labels: OutputLabelType[];
};

export type PrivacyMetric = {
  name: string;
  display_name: string;
  description: string;
};

export type GetPrivacyMetricsResponseType = {
  metrics: PrivacyMetric[];
};

export type AnalyzeTxPrivacyRequestBody = {
  txid: string;
  privacy_metrics: string[];
};

export type AnalyzeTxPrivacyResponseType = {
  results: string;
};
