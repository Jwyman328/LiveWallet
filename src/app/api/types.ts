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
