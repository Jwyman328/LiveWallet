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
