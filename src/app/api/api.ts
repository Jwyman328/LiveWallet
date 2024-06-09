import {
  GetUtxosResponseType,
  GetBalanceResponseType,
  CurrentFeesResponseType,
  UtxoRequestParam,
  HealthStatusResponseType,
  CreateTxFeeEstimationResponseType,
  InitiateWalletResponseType,
  CreateMockWalletResponseType,
  DeleteCurrentWalletResponseType,
} from './types';

import { Network } from '../types/network';
import { WalletTypes } from '../types/scriptTypes';
import { configs } from '../configs';

async function fetchHandler(
  url: string,
  method = 'GET',
  body?: Record<string, any>,
) {
  const response = await fetch(url, {
    method: method,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  return response;
}

export class ApiClient {
  static async getBalance() {
    const response = await fetchHandler(`${configs.backendServerBaseUrl}/balance
`);

    const data = await response.json();
    return data as GetBalanceResponseType;
  }
  static async getUtxos() {
    const response = await fetchHandler(`${configs.backendServerBaseUrl}/utxos
`);

    const data = await response.json();

    return data as GetUtxosResponseType;
  }
  static async createTxFeeEstimation(
    utxos: UtxoRequestParam[],
    feeRate: number = 1,
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/utxos/fees?feeRate=${feeRate}`,
      'POST',
      utxos,
    );

    const data = await response.json();
    return data as CreateTxFeeEstimationResponseType;
  }

  static async getCurrentFees() {
    const response =
      await fetchHandler(`${configs.backendServerBaseUrl}/fees/current
`);
    const data = await response.json();
    return data as CurrentFeesResponseType;
  }

  static async initiateWallet(
    walletDescriptor: string,
    network: Network,
    electrumUrl: string,
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/wallet`,
      'POST',
      { descriptor: walletDescriptor, electrumUrl, network },
    );

    const data = await response.json();
    return data as InitiateWalletResponseType;
  }

  static async createMockWallet(
    network: Network,
    type: WalletTypes,
    utxoCount: string,
    minUtxoAmount: string,
    maxUtxoAmount: string,
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/wallet/spendable`,
      'POST',
      { type, network, utxoCount, minUtxoAmount, maxUtxoAmount },
    );

    const data = (await response.json()) as CreateMockWalletResponseType;
    return data;
  }
  static async getWalletType() {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/wallet/type`,
      'GET',
    );

    const data = await response.json();
    return data.type as WalletTypes;
  }

  static async getServerHealthStatus() {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/health-check/status`,
      'GET',
    );

    const data = await response.json();
    return data as HealthStatusResponseType;
  }

  static async deleteCurrentWallet() {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/wallet/remove`,
      'DELETE',
    );

    const data = (await response.json()) as DeleteCurrentWalletResponseType;
    return data;
  }
}
