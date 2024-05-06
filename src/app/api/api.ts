import {
  GetUtxosResponseType,
  GetBalanceResponseType,
  CurrentFeesResponseType,
  UtxoRequestParam,
} from './types';

import { Network } from '../types/network';
import { WalletTypes } from '../types/scriptTypes';

async function fetchHandler(url: string, method = 'GET', body?: any) {
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
    const response = await fetchHandler('http://localhost:5011/balance');

    const data = await response.json();
    return data as GetBalanceResponseType;
  }
  static async getUtxos() {
    const response = await fetchHandler('http://localhost:5011/utxos');

    const data = await response.json();

    return data as GetUtxosResponseType;
  }
  static async createTxFeeEstimation(
    utxos: UtxoRequestParam[],
    feeRate: number = 1,
  ) {
    const response = await fetchHandler(
      `http://localhost:5011/utxos/fees?feeRate=${feeRate}`,
      'POST',
      utxos,
    );

    const data = await response.json();
    return data;
  }

  static async getCurrentFees() {
    const response = await fetchHandler('http://localhost:5011/fees/current');
    const data = await response.json();
    return data as CurrentFeesResponseType;
  }

  static async initiateWallet(
    walletDescriptor: string,
    network: Network,
    electrumUrl: string,
  ) {
    const response = await fetchHandler(
      `http://localhost:5011/wallet`,
      'POST',
      { descriptor: walletDescriptor, electrumUrl, network },
    );

    const data = await response.json();
    return data;
  }
  static async getWalletType() {
    const response = await fetchHandler(
      `http://localhost:5011/wallet/type`,
      'GET',
    );

    const data = await response.json();
    return data.type as WalletTypes;
  }

  static async getServerHealthStatus() {
    const response = await fetchHandler(
      `http://localhost:5011/health-check/status`,
      'GET',
    );

    const data = await response.json();
    return data as HealthStatusResponseType;
  }
}
