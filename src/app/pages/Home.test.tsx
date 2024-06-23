import {
  fireEvent,
  render,
  waitFor,
  act,
  within,
} from '@testing-library/react';
import { WrappedInAppWrappers, mockElectron } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';
import Home from './Home';
import {
  mockImportedWalletData,
  mockImportedWalletDataWithoutConfigs,
} from '../../__tests__/mocks';

const mockNavigate = jest.fn();
let getBalanceSpy: jest.SpyInstance;
let getUtxosSpy: jest.SpyInstance;
let getWalletType: jest.SpyInstance;
let deleteCurrentWalletSpy: jest.SpyInstance;
let getCurrentFeesSpy: jest.SpyInstance;
let createTxFeeEstimateSpy: jest.SpyInstance;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUtXos = [
  {
    amount: 200000000,
    txid: 'f2f8f156b2bc2a2416115188705ccfae8296a1ac28fe6d7a885c0dc32e3d70ba',
    vout: 0,
  },
  {
    amount: 100000000,
    txid: '1f6fb0b03767109057792f3055350d09865aad21c454ee224ac6a34d98dfd724',
    vout: 0,
  },
  {
    amount: 1,
    txid: '9d831635ba4981a7c4a0354a26f00e15711e6cbad0eadc34b0775c585666a36b',
    vout: 0,
  },
];

describe('Home', () => {
  beforeEach(() => {
    getBalanceSpy = jest.spyOn(ApiClient, 'getBalance');
    getBalanceSpy.mockResolvedValue({
      confirmed: 300000001,
      spendable: 300000001,
      total: 300000001,
    });
    getUtxosSpy = jest.spyOn(ApiClient, 'getUtxos');
    getUtxosSpy.mockResolvedValue({
      utxos: mockUtXos,
    });

    getWalletType = jest.spyOn(ApiClient, 'getWalletType');
    getWalletType.mockResolvedValue('P2WPKH');

    deleteCurrentWalletSpy = jest.spyOn(ApiClient, 'deleteCurrentWallet');
    deleteCurrentWalletSpy.mockResolvedValue({ message: 'Success' });

    getCurrentFeesSpy = jest.spyOn(ApiClient, 'getCurrentFees');
    getCurrentFeesSpy.mockResolvedValue({ low: 5, medium: 10, high: 15 });

    createTxFeeEstimateSpy = jest.spyOn(ApiClient, 'createTxFeeEstimation');
    createTxFeeEstimateSpy.mockResolvedValue({
      spendable: true,
      fee: '15000000',
    });
  });

  afterEach(() => {
    mockElectron.ipcRenderer.sendMessage.mockClear();
    mockElectron.ipcRenderer.on.mockClear();
    getBalanceSpy.mockClear();
    getUtxosSpy.mockClear();
    getBalanceSpy.mockClear();
    deleteCurrentWalletSpy.mockClear();
    getCurrentFeesSpy.mockClear();
    createTxFeeEstimateSpy.mockClear();
  });

  it('Home screen shows correct data by default', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    mockElectron.ipcRenderer.on.mockResolvedValue(
      mockImportedWalletDataWithoutConfigs,
    );
    act(() => {
      // make sure the wallet-data callback runs
      const handleWalletDataFunction =
        mockElectron.ipcRenderer.on.mock.calls[0][1];
      handleWalletDataFunction(mockImportedWalletDataWithoutConfigs);
    });

    expect(mockElectron.ipcRenderer.on.mock.calls[0][0]).toBe('wallet-data');

    expect(getBalanceSpy).toHaveBeenCalled();
    expect(getUtxosSpy).toHaveBeenCalled();
    expect(getCurrentFeesSpy).toHaveBeenCalled();

    const title = await screen.findByText('Custom Fee Environment');
    const feeTitle = await screen.findByText('Current fees');

    const lowFeeTitle = await screen.findByText('Low');
    const mediumFeeTitle = await screen.findByText('Medium');
    const highFeeTitle = await screen.findByText('High');

    const lowFeeAmount = await screen.findByText('5');
    const mediumFeeAmount = await screen.findByText('10');
    const highFeeAmount = await screen.findByText('15');

    const balance = await screen.findByText('Balance: 3.00000001 BTC');
    const customFeeRate = await screen.findByText('Fee rate: 10 sat/vB');

    const utxoTableTitle = await screen.findByText('UTXOS');
    const utxoTxIdOne = await screen.findByText('f2f8f15....e3d70ba');
    const utxoTxIdTwo = await screen.findByText('1f6fb0b....8dfd724');
    const utxoOneAmount = await screen.findByText('1.00000000');
    const utxoTwoAmount = await screen.findByText('2.00000000');

    const utxoOneFeeEstimate = await screen.findByText('0.0020%');
    const utxoTwoFeeEstimate = await screen.findByText('0.0010%');
    const utxoThreeFeeEstimate = await screen.findByText('200000.00%');
    const utxoThreeAmount = await screen.findByText('0.00000001');
    const spendableIcons = await screen.findAllByTestId('spendable-icon');
    const notSpendableIcons =
      await screen.findAllByTestId('not-spendable-icon');

    const estimateBatchTxButton = screen.getByRole('button', {
      name: 'Estimate batch',
    });

    const batchTotalFees = screen.getByText('Total fees: ...');
    const batchFeePct = screen.getByText('Fee pct: ...');

    expect(title).toBeInTheDocument();
    expect(feeTitle).toBeInTheDocument();
    expect(lowFeeTitle).toBeInTheDocument();
    expect(mediumFeeTitle).toBeInTheDocument();
    expect(highFeeTitle).toBeInTheDocument();
    expect(lowFeeAmount).toBeInTheDocument();
    expect(mediumFeeAmount).toBeInTheDocument();
    expect(highFeeAmount).toBeInTheDocument();
    expect(balance).toBeInTheDocument();
    expect(customFeeRate).toBeInTheDocument();
    expect(utxoTableTitle).toBeInTheDocument();
    expect(utxoTxIdOne).toBeInTheDocument();
    expect(utxoTxIdTwo).toBeInTheDocument();
    expect(utxoOneFeeEstimate).toBeInTheDocument();
    expect(utxoTwoFeeEstimate).toBeInTheDocument();
    expect(utxoThreeFeeEstimate).toBeInTheDocument();
    expect(utxoOneAmount).toBeInTheDocument();
    expect(utxoTwoAmount).toBeInTheDocument();
    expect(utxoThreeAmount).toBeInTheDocument();
    expect(spendableIcons.length).toBe(2);
    expect(notSpendableIcons.length).toBe(1);
    expect(batchTotalFees).toBeInTheDocument();
    expect(batchFeePct).toBeInTheDocument();
    expect(estimateBatchTxButton).toBeDisabled();
  });

  it('Changing current fee rate environment changes the fee rate estimation for each utxo', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );
    act(() => {
      // make sure the wallet-data callback runs
      //
      const higherFeeConfig = {
        ...mockImportedWalletData,
        feeRate: '100',
      };
      mockElectron.ipcRenderer.on.mockResolvedValue(higherFeeConfig);
      const handleWalletDataFunction =
        mockElectron.ipcRenderer.on.mock.calls[0][1];
      handleWalletDataFunction(higherFeeConfig);
    });
    const utxoTableTitle = await screen.findByText('UTXOS');
    const utxoTxIdOne = await screen.findByText('f2f8f15....e3d70ba');
    const utxoOneAmount = await screen.findByText('1.00000000');

    const customFeeRate = await screen.findByText('Fee rate: 100 sat/vB');

    // now a higher estimated rate to spend this utxo should now be showing
    const utxoOneFeeEstimate = await screen.findByText('0.0200%');
    expect(utxoTableTitle).toBeInTheDocument();
    expect(utxoTableTitle).toBeInTheDocument();
    expect(utxoOneFeeEstimate).toBeInTheDocument();
    expect(utxoTxIdOne).toBeInTheDocument();
    expect(customFeeRate).toBeInTheDocument();

    expect(utxoOneAmount).toBeInTheDocument();
  });

  // test default settings slideout
  it('Test default settings slideout', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment');
    expect(title).toBeInTheDocument();

    const slideoutButton = screen.getByTestId('settings-button');
    fireEvent.click(slideoutButton);

    const settingsTitle = await screen.findByText('Settings');
    expect(settingsTitle).toBeInTheDocument();

    const slideout = screen.getByTestId('settings-slideout');

    // const defaultMinFeeRate = screen.getByText('1');
    const satsMetricOption = within(slideout).getByRole('radio', {
      name: 'SATS',
    });
    const btcMetricOption = within(slideout).getByRole('radio', {
      name: 'BTC',
    });
    expect(satsMetricOption).not.toBeChecked();
    expect(btcMetricOption).toBeChecked();

    const minFeeRateLabel = within(slideout).getByText('Min fee rate');
    const minFeeRate = minFeeRateLabel.parentNode?.nextSibling
      ?.firstChild as HTMLInputElement;

    expect(minFeeRate?.value).toBe('1');
    const maxFeeRateLabel = within(slideout).getByText('Max fee rate');

    const maxFeeRate = maxFeeRateLabel.parentNode?.nextSibling
      ?.firstChild as HTMLInputElement;

    expect(maxFeeRate?.value).toBe('1,000');
    // test default Colors
    const zeroPercentColor =
      within(slideout).getByDisplayValue('rgb(220, 252, 231)');
    const twoPercentColor =
      within(slideout).getByDisplayValue('rgb(254, 240, 138)');
    const tenPercentColor =
      within(slideout).getByDisplayValue('rgb(248, 113, 113)');
    const fortyFivePercentColor =
      within(slideout).getByDisplayValue('rgb(239, 68, 68)');
    const sixtyFiveColor =
      within(slideout).getByDisplayValue('rgb(220, 38, 38)');
    const eightyFiveColor =
      within(slideout).getByDisplayValue('rgb(185, 28, 28)');
    const hundredPercentColor =
      within(slideout).getByDisplayValue('rgb(153, 27, 27)');
    // test default percents
    const zeroPercent = within(slideout).getByDisplayValue('0%');
    const twoPercent = within(slideout).getByDisplayValue('2%');
    const tenPercent = within(slideout).getByDisplayValue('10%');
    const fortyFivePercent = within(slideout).getByDisplayValue('45%');
    const sixtyFive = within(slideout).getByDisplayValue('65%');
    const eightyFive = within(slideout).getByDisplayValue('85%');
    const hundredPercent = within(slideout).getByDisplayValue('100%');
    expect(zeroPercent).toBeInTheDocument();
    expect(twoPercent).toBeInTheDocument();
    expect(tenPercent).toBeInTheDocument();
    expect(fortyFivePercent).toBeInTheDocument();
    expect(sixtyFive).toBeInTheDocument();
    expect(eightyFive).toBeInTheDocument();
    expect(hundredPercent).toBeInTheDocument();

    expect(zeroPercentColor).toBeInTheDocument();
    expect(twoPercentColor).toBeInTheDocument();
    expect(tenPercentColor).toBeInTheDocument();
    expect(fortyFivePercentColor).toBeInTheDocument();
    expect(sixtyFiveColor).toBeInTheDocument();
    expect(eightyFiveColor).toBeInTheDocument();
    expect(hundredPercentColor).toBeInTheDocument();

    const logOutButton = screen.getByRole('button', { name: 'Log out' });
    expect(logOutButton).toBeEnabled();
  });

  it('Test default settings slideout', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment');
    expect(title).toBeInTheDocument();

    const slideoutButton = screen.getByTestId('settings-button');
    fireEvent.click(slideoutButton);

    const settingsTitle = await screen.findByText('Settings');
    expect(settingsTitle).toBeInTheDocument();

    const logOutButton = screen.getByRole('button', { name: 'Log out' });
    expect(logOutButton).toBeEnabled();
    fireEvent.click(logOutButton);

    await waitFor(() => {
      expect(deleteCurrentWalletSpy).toHaveBeenCalled();

      // clear wallet and wallet config data
      expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
        'save-wallet-configs',
        undefined,
      );

      expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
        'save-wallet',
        undefined,
      );

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('Changing to sats metric settings changes the values being displayed', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment');
    expect(title).toBeInTheDocument();

    const slideoutButton = screen.getByTestId('settings-button');
    fireEvent.click(slideoutButton);

    const settingsTitle = await screen.findByText('Settings');
    expect(settingsTitle).toBeInTheDocument();

    const slideout = screen.getByTestId('settings-slideout');

    // const defaultMinFeeRate = screen.getByText('1');
    let satsMetricOption = within(slideout).getByRole('radio', {
      name: 'SATS',
    });
    let btcMetricOption = within(slideout).getByRole('radio', {
      name: 'BTC',
    });
    expect(satsMetricOption).not.toBeChecked();
    expect(btcMetricOption).toBeChecked();

    fireEvent.click(satsMetricOption);

    satsMetricOption = within(slideout).getByRole('radio', {
      name: 'SATS',
    });
    btcMetricOption = within(slideout).getByRole('radio', {
      name: 'BTC',
    });
    expect(satsMetricOption).toBeChecked();
    expect(btcMetricOption).not.toBeChecked();

    const utxoOneAmount = await screen.findByText('100,000,000');
    const utxoTwoAmount = await screen.findByText('200,000,000');
    const balance = await screen.findByText('Balance: 300,000,001 sats');
    expect(utxoOneAmount).toBeInTheDocument();
    expect(utxoTwoAmount).toBeInTheDocument();
    expect(balance).toBeInTheDocument();
  });

  test('Tells main thread the current page on first render', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment');
    expect(title).toBeInTheDocument();

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'current-route',
      '/home',
    );
  });

  test('Tells main thread to get the wallet data on first render', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment');
    expect(title).toBeInTheDocument();

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'get-wallet-data',
    );
  });

  it('Creating batch tx', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment');
    expect(title).toBeInTheDocument();

    await waitFor(() => expect(getUtxosSpy).toHaveBeenCalled());

    const txCheckBoxes = await screen.findAllByRole('checkbox');

    // three txs so should be three tx checkboxes to be able to include
    // in our batched tx, as well as a 4th button to include all txs.
    expect(txCheckBoxes.length).toBe(4);

    const includeAllUtxosButton = txCheckBoxes[0];
    fireEvent.click(includeAllUtxosButton);

    const estimateBatchTxButton = screen.getByRole('button', {
      name: 'Estimate batch',
    });

    expect(estimateBatchTxButton).toBeEnabled();

    const selectedTotal = screen.getByText('Selected: 3');
    expect(selectedTotal).toBeInTheDocument();

    const amountSelectedTotal = screen.getByText('amount: 3.00000001 BTC');
    expect(amountSelectedTotal).toBeInTheDocument();

    fireEvent.click(estimateBatchTxButton);

    const expectedData = mockUtXos.map((utxo) => ({
      id: utxo.txid,
      vout: utxo.vout,
      amount: utxo.amount,
    }));
    await waitFor(() => {
      expect(createTxFeeEstimateSpy).toHaveBeenCalledTimes(1);
      expect(createTxFeeEstimateSpy).toHaveBeenCalledWith(expectedData, 10);
    });

    const totalFees = await screen.findByText('Total fees: ~0.15000810 BTC');
    const totalFeePct = await screen.findByText('Fee pct: ~5.0003%');
    expect(totalFees).toBeInTheDocument();
    expect(totalFeePct).toBeInTheDocument();
  });

  it('Importing in wallet data with configs', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment');
    expect(title).toBeInTheDocument();

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'get-wallet-data',
    );

    mockElectron.ipcRenderer.on.mockResolvedValue(mockImportedWalletData);
    act(() => {
      // make sure the wallet-data callback runs
      const handleWalletDataFunction =
        mockElectron.ipcRenderer.on.mock.calls[0][1];
      handleWalletDataFunction(mockImportedWalletData);
    });

    expect(mockElectron.ipcRenderer.on.mock.calls[0][0]).toBe('wallet-data');

    // test imported configs are automatically set
    const customFeeRate = await screen.findByText(
      `Fee rate: ${mockImportedWalletData.feeRate} sat/vB`,
    );
    expect(customFeeRate).toBeInTheDocument();

    const slideoutButton = screen.getByTestId('settings-button');
    fireEvent.click(slideoutButton);

    const settingsTitle = await screen.findByText('Settings');
    expect(settingsTitle).toBeInTheDocument();

    const slideout = screen.getByTestId('settings-slideout');

    const minFeeRateLabel = within(slideout).getByText('Min fee rate');
    const minFeeRate = minFeeRateLabel.parentNode?.nextSibling
      ?.firstChild as HTMLInputElement;
    expect(minFeeRate?.value).toBe(mockImportedWalletData.minFeeScale?.value);

    const maxFeeRateLabel = within(slideout).getByText('Max fee rate');

    const maxFeeRate = maxFeeRateLabel.parentNode?.nextSibling
      ?.firstChild as HTMLInputElement;

    expect(maxFeeRate?.value).toBe(mockImportedWalletData.feeScale?.label);

    const firstPercentColor = within(slideout).getByDisplayValue(
      // @ts-ignore
      mockImportedWalletData.feeRateColorMapValues[0][1],
    );

    const firstPercent = within(slideout).getByDisplayValue(
      // @ts-ignore
      `${mockImportedWalletData?.feeRateColorMapValues[0][0]}%`,
    );

    const secondPercentColor = within(slideout).getByDisplayValue(
      // @ts-ignore
      mockImportedWalletData.feeRateColorMapValues[1][1],
    );

    const secondPercent = within(slideout).getByDisplayValue(
      // @ts-ignore
      `${mockImportedWalletData?.feeRateColorMapValues[1][0]}%`,
    );

    expect(firstPercent).toBeInTheDocument();
    expect(firstPercentColor).toBeInTheDocument();
    expect(secondPercent).toBeInTheDocument();
    expect(secondPercentColor).toBeInTheDocument();
  });

  // test changing config sends update? / other / all main thread calls
});
