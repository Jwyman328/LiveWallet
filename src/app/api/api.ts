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
  HardwareWalletsResponseType,
  HardwareWalletPromptToUnlockResponseType,
  HardwareWalletUnlockResponseType,
  HardwareWalletXpubResponseType,
  HardwareWalletSetPassphraseResponseType,
  HardwareWalletCloseAndRemoveResponseType,
  GetBTCPriceResponseType,
  GetTransactionsResponseType,
  GetOutputsResponseType,
  GetOutputLabelsResponseType,
  AddLabelRequestBody,
  RemoveLabelRequestParams,
  AddLabelResponseType,
  RemoveLabelResponseType,
  GetOutputLabelsPopulateResponseType,
  PopulateOutputLabelsBodyType,
  PopulateOutputLabelsResponse,
  GetPrivacyMetricsResponseType,
  AnalyzeTxPrivacyResponseType,
  AnalyzeTxPrivacyRequestBody,
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

  static async getTransactions() {
    const response =
      await fetchHandler(`${configs.backendServerBaseUrl}/transactions/
`);

    const data = await response.json();

    return data as GetTransactionsResponseType;
  }

  static async getOutputs() {
    const response =
      await fetchHandler(`${configs.backendServerBaseUrl}/transactions/outputs
`);

    const data = await response.json();

    return data as GetOutputsResponseType;
  }

  static async getOutputLabels() {
    const response =
      await fetchHandler(`${configs.backendServerBaseUrl}/transactions/outputs/labels
`);

    const data = await response.json();

    return data as GetOutputLabelsResponseType;
  }

  static async getOutputLabelsUnique() {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/transactions/outputs/populate-labels`,
    );

    const data = await response.json();

    return data as GetOutputLabelsPopulateResponseType;
  }

  static async populateOutputLabelsUnique(
    outputLabels: PopulateOutputLabelsBodyType,
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/transactions/outputs/populate-labels`,
      'POST',
      outputLabels,
    );

    const data = await response.json();

    return data as PopulateOutputLabelsResponse;
  }

  static async addOutputLabel(body: AddLabelRequestBody) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/transactions/outputs/label`,
      'POST',
      body,
    );

    const data = await response.json();

    return data as AddLabelResponseType;
  }

  static async removeOutputLabel(
    txid: RemoveLabelRequestParams['txid'],
    vout: RemoveLabelRequestParams['vout'],
    labelName: RemoveLabelRequestParams['labelName'],
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/transactions/outputs/label?txid=${txid}&vout=${vout}&labelName=${labelName}`,
      'DELETE',
    );

    const data = await response.json();

    return data as RemoveLabelResponseType;
  }

  static async createTxFeeEstimation(
    utxos: UtxoRequestParam[],
    feeRate: number = 1,
    outputCount: number = 1,
    includePsbtInResponse: boolean = false,
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/utxos/fees?feeRate=${feeRate}&outputCount=${outputCount}&includePsbt=${includePsbtInResponse}`,
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
    gapLimit: number,
    changeDescriptor?: string,
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/wallet`,
      'POST',
      {
        descriptor: walletDescriptor,
        electrumUrl,
        network,
        gapLimit,
        change_descriptor: changeDescriptor,
      },
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

  static async getConnectedHardwareWallets() {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/hardware-wallets`,
      'GET',
    );

    const data = (await response.json()) as HardwareWalletsResponseType;
    return data;
  }

  static async promptToUnlockWallet(walletUuid: string) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/hardware-wallets/unlock/${walletUuid}/prompt`,
      'POST',
    );

    const data =
      (await response.json()) as HardwareWalletPromptToUnlockResponseType;
    return data;
  }

  static async unlockWallet(walletUuid: string, pin: string) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/hardware-wallets/unlock/${walletUuid}/pin`,
      'POST',
      { pin },
    );

    const data = (await response.json()) as HardwareWalletUnlockResponseType;
    return data;
  }

  static async getXpubFromDevice(
    walletUuid: string,
    accountNumber: string,
    derivationPath: string,
    network: Network,
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/hardware-wallets/unlock/${walletUuid}/xpub`,
      'POST',
      {
        account_number: accountNumber,
        derivation_path: derivationPath,
        network,
      },
    );

    const data = (await response.json()) as HardwareWalletXpubResponseType;
    return data;
  }

  static async setWalletPassphrase(walletUuid: string, passphrase: string) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/hardware-wallets/unlock/${walletUuid}/passphrase`,
      'POST',
      { passphrase },
    );

    const data =
      (await response.json()) as HardwareWalletSetPassphraseResponseType;
    return data;
  }

  static async closeAndRemoveHardwareWallets() {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/hardware-wallets/close`,
      'DELETE',
    );

    const data =
      (await response.json()) as HardwareWalletCloseAndRemoveResponseType;
    return data;
  }
  static async getCurrentBtcPrice() {
    const response = await fetchHandler(
      'https://mempool.space/api/v1/prices',
      'GET',
    );

    const data = (await response.json()) as GetBTCPriceResponseType;
    return data;
  }

  static async getAllPrivacyMetrics() {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/privacy-metrics`,
      'GET',
    );

    const data = (await response.json()) as GetPrivacyMetricsResponseType;
    return data;
  }

  static async analyzeTxPrivacy(
    analyzeTxPrivacyRequestBody: AnalyzeTxPrivacyRequestBody,
  ) {
    const response = await fetchHandler(
      `${configs.backendServerBaseUrl}/privacy-metrics`,
      'POST',
      analyzeTxPrivacyRequestBody,
    );

    const data = (await response.json()) as AnalyzeTxPrivacyResponseType;
    return data;
  }
}
