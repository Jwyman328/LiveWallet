import {
  fireEvent,
  render,
  waitFor,
  act,
  within,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { WrappedInAppWrappers, mockElectron } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';
import Home from './Home';
import {
  mockGetBtcPriceResponse,
  mockImportedWalletData,
  mockImportedWalletDataWithoutConfigs,
} from '../../__tests__/mocks';
import { Pages } from '../../renderer/pages';

const mockNavigate = jest.fn();
let getBalanceSpy: jest.SpyInstance;
let getUtxosSpy: jest.SpyInstance;
let getWalletType: jest.SpyInstance;
let deleteCurrentWalletSpy: jest.SpyInstance;
let getCurrentFeesSpy: jest.SpyInstance;
let createTxFeeEstimateSpy: jest.SpyInstance;
let getBtcPriceSpy: jest.SpyInstance;
let mockUseLocation = {};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation,
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

    getBtcPriceSpy = jest.spyOn(ApiClient, 'getCurrentBtcPrice');
    getBtcPriceSpy.mockResolvedValue(mockGetBtcPriceResponse);
    mockUseLocation = {
      state: {
        numberOfXpubs: 1,
        signaturesNeeded: 1,
      },
    };
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
    getBtcPriceSpy.mockClear();
    mockUseLocation = {};
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

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
    const feeTitle = await screen.findByText('Current fees');

    const btcPriceTitle = await screen.findByText('BTC Price');
    const btcPriceInput = await screen.findByTestId('btc-price-input');

    const lowFeeTitle = await screen.findByText('Low');
    const mediumFeeTitle = await screen.findByText('Medium');
    const highFeeTitle = await screen.findByText('High');

    const lowFeeAmount = await screen.findByText('5');
    const mediumFeeAmount = await screen.findByText('10');
    const highFeeAmount = await screen.findByText('15');

    const balance = await screen.findByText('Balance: 3.00000001 BTC');
    const customFeeRate = await screen.findByText('Fee rate: 10 sat/vB');

    const outputsTitle = await screen.findByText('Outputs');
    const countTitle = await screen.findByText('Count');
    const outputCountInput = await screen.findByTestId('output-count');

    const utxoTableTitle = await screen.findByText('Inputs');
    const utxoTxIdOne = await screen.findByText('f2f8f15....e3d70ba');
    const utxoTxIdTwo = await screen.findByText('1f6fb0b....8dfd724');
    const utxoOneAmount = await screen.findByText('1.00000000');
    const utxoTwoAmount = await screen.findByText('2.00000000');

    // since btc price is 100k and amount 1btc
    const utxoOneAmountUSD = await screen.findByText('$100,000');
    // since btc price is 100k and amount 2btc
    const utxoTwoAmountUSD = await screen.findByText('$200,000');

    const utxoOneFeeEstimate = await screen.findByText('0.0015%');
    const utxoTwoFeeEstimate = await screen.findByText('0.0008%');
    const utxoFeeUsd = await screen.findAllByText('$2');
    const utxoThreeFeeEstimate = await screen.findByText('153000.00%');
    const utxoThreeAmount = await screen.findByText('0.00000001');
    const spendableIcons = await screen.findAllByTestId('spendable-icon');
    const notSpendableIcons =
      await screen.findAllByTestId('not-spendable-icon');

    const estimateBatchTxButton = screen.queryByRole('button', {
      name: 'Estimate Batch',
    });

    const batchTotalFees = screen.getByText('Total fees: ...');
    const batchFeePct = screen.getByText('Fee cost: ...');

    expect(title).toBeInTheDocument();
    expect(feeTitle).toBeInTheDocument();
    expect(btcPriceTitle).toBeInTheDocument();
    expect(btcPriceInput).toHaveValue(
      `$${mockGetBtcPriceResponse.USD.toLocaleString()}`,
    );
    expect(lowFeeTitle).toBeInTheDocument();
    expect(mediumFeeTitle).toBeInTheDocument();
    expect(highFeeTitle).toBeInTheDocument();
    expect(lowFeeAmount).toBeInTheDocument();
    expect(mediumFeeAmount).toBeInTheDocument();
    expect(highFeeAmount).toBeInTheDocument();
    expect(balance).toBeInTheDocument();
    expect(customFeeRate).toBeInTheDocument();
    expect(outputsTitle).toBeInTheDocument();
    expect(countTitle).toBeInTheDocument();
    expect(outputCountInput).toHaveValue('2');
    expect(utxoTableTitle).toBeInTheDocument();
    expect(utxoTxIdOne).toBeInTheDocument();
    expect(utxoTxIdTwo).toBeInTheDocument();
    expect(utxoOneFeeEstimate).toBeInTheDocument();
    expect(utxoTwoFeeEstimate).toBeInTheDocument();
    // a utxo fee usd for all three utxos
    expect(utxoFeeUsd.length).toBe(3);
    expect(utxoThreeFeeEstimate).toBeInTheDocument();
    expect(utxoOneAmount).toBeInTheDocument();
    expect(utxoTwoAmount).toBeInTheDocument();
    expect(utxoOneAmountUSD).toBeInTheDocument();
    expect(utxoTwoAmountUSD).toBeInTheDocument();
    expect(utxoThreeAmount).toBeInTheDocument();
    expect(spendableIcons.length).toBe(2);
    expect(notSpendableIcons.length).toBe(1);
    expect(batchTotalFees).toBeInTheDocument();
    expect(batchFeePct).toBeInTheDocument();
    // batch not showing since BATCH tx type is not selected by default, SINGLE is
    expect(estimateBatchTxButton).not.toBeInTheDocument();
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
        feeRate: '500',
      };
      mockElectron.ipcRenderer.on.mockResolvedValue(higherFeeConfig);
      const handleWalletDataFunction =
        mockElectron.ipcRenderer.on.mock.calls[0][1];
      handleWalletDataFunction(higherFeeConfig);
    });
    const utxoTableTitle = await screen.findByText('Inputs');
    const utxoTxIdOne = await screen.findByText('f2f8f15....e3d70ba');
    const utxoOneAmount = await screen.findByText('1.00000000');

    // since price is 100k and amount 1btc, new fee rate should not change the amount usd
    const utxoOneAmountUSD = await screen.findByText('$100,000');
    // since price is 100k and amount 2btc, new fee rate should not change the amount usd
    const utxoTwoAmountUSD = await screen.findByText('$200,000');

    const customFeeRate = await screen.findByText('Fee rate: 500 sat/vB');

    // now a higher estimated rate and usd value to spend this utxo should now be showing
    const utxoOneFeeEstimate = await screen.findByText('0.0382%');
    const utxoFeeUsd = await screen.findAllByText('$77');

    expect(utxoTableTitle).toBeInTheDocument();
    expect(utxoTableTitle).toBeInTheDocument();
    expect(utxoOneFeeEstimate).toBeInTheDocument();
    expect(utxoTxIdOne).toBeInTheDocument();
    expect(utxoOneAmountUSD).toBeInTheDocument();
    expect(utxoTwoAmountUSD).toBeInTheDocument();
    expect(customFeeRate).toBeInTheDocument();
    expect(utxoFeeUsd.length).toBe(3);

    expect(utxoOneAmount).toBeInTheDocument();
  });

  it('Changing btc price changes the usd amount and usd fee estimation for each utxo', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );
    let utxoOneAmount = await screen.findByText('1.00000000');
    let utxoTwoAmount = await screen.findByText('2.00000000');

    // since price is 100k and amount 1btc
    let utxoOneAmountUSD = await screen.findByText('$100,000');
    // since price is 100k and amount 2btc
    let utxoTwoAmountUSD = await screen.findByText('$200,000');

    let utxoOneFeeEstimate = await screen.findByText('0.0015%');
    let utxoTwoFeeEstimate = await screen.findByText('0.0008%');
    let utxoFeeUsd = await screen.findAllByText('$2');
    let utxoThreeFeeEstimate = await screen.findByText('153000.00%');
    let utxoThreeAmount = await screen.findByText('0.00000001');

    expect(utxoOneFeeEstimate).toBeInTheDocument();
    expect(utxoOneAmountUSD).toBeInTheDocument();
    expect(utxoTwoFeeEstimate).toBeInTheDocument();
    expect(utxoThreeFeeEstimate).toBeInTheDocument();
    expect(utxoThreeAmount).toBeInTheDocument();
    expect(utxoTwoAmount).toBeInTheDocument();
    expect(utxoTwoAmountUSD).toBeInTheDocument();
    expect(utxoFeeUsd.length).toBe(3);

    expect(utxoOneAmount).toBeInTheDocument();

    // now change btc price and see the  difference
    const btcPriceInput = await screen.findByTestId('btc-price-input');
    // increase btc price by a factor of 10
    fireEvent.change(btcPriceInput, { target: { value: '1000000' } });

    // no change in non usd values
    utxoOneFeeEstimate = await screen.findByText('0.0015%');
    utxoTwoFeeEstimate = await screen.findByText('0.0008%');
    utxoThreeFeeEstimate = await screen.findByText('153000.00%');
    utxoThreeAmount = await screen.findByText('0.00000001');
    utxoOneAmount = await screen.findByText('1.00000000');
    utxoTwoAmount = await screen.findByText('2.00000000');

    // Fee usd should now be 10x higher
    utxoFeeUsd = await screen.findAllByText('$15');
    // since price is now 1M and amount 1btc
    utxoOneAmountUSD = await screen.findByText('$1,000,000');
    // since price is now 1M and amount 2btc
    utxoTwoAmountUSD = await screen.findByText('$2,000,000');

    expect(utxoOneFeeEstimate).toBeInTheDocument();
    expect(utxoOneAmountUSD).toBeInTheDocument();
    expect(utxoTwoFeeEstimate).toBeInTheDocument();
    expect(utxoThreeFeeEstimate).toBeInTheDocument();
    expect(utxoThreeAmount).toBeInTheDocument();
    expect(utxoTwoAmount).toBeInTheDocument();
    expect(utxoTwoAmountUSD).toBeInTheDocument();
    expect(utxoFeeUsd.length).toBe(3);

    expect(utxoOneAmount).toBeInTheDocument();
  });

  it('Test changing btc price, fee rate', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );
    act(() => {
      // make sure the wallet-data callback runs
      const higherFeeConfig = {
        ...mockImportedWalletData,
        feeRate: '500',
      };
      mockElectron.ipcRenderer.on.mockResolvedValue(higherFeeConfig);
      const handleWalletDataFunction =
        mockElectron.ipcRenderer.on.mock.calls[0][1];
      handleWalletDataFunction(higherFeeConfig);
    });

    // now change btc price and see the  difference
    const btcPriceInput = await screen.findByTestId('btc-price-input');
    // increase btc price by a factor of 10
    fireEvent.change(btcPriceInput, { target: { value: '1000000' } });

    const utxoTableTitle = await screen.findByText('Inputs');
    const utxoTxIdOne = await screen.findByText('f2f8f15....e3d70ba');
    const utxoOneAmount = await screen.findByText('1.00000000');

    // since price is 1M and amount 1btc
    const utxoOneAmountUSD = await screen.findByText('$1,000,000');
    // since price is 1M and amount 2btc
    const utxoTwoAmountUSD = await screen.findByText('$2,000,000');

    const customFeeRate = await screen.findByText('Fee rate: 500 sat/vB');

    // now a higher estimated rate and usd value to spend this utxo should be showing
    const utxoOneFeeEstimate = await screen.findByText('0.0382%');
    const utxoFeeUsd = await screen.findAllByText('$765');

    expect(utxoTableTitle).toBeInTheDocument();
    expect(utxoTableTitle).toBeInTheDocument();
    expect(utxoOneFeeEstimate).toBeInTheDocument();
    expect(utxoTxIdOne).toBeInTheDocument();
    expect(utxoOneAmountUSD).toBeInTheDocument();
    expect(utxoTwoAmountUSD).toBeInTheDocument();
    expect(customFeeRate).toBeInTheDocument();
    expect(utxoFeeUsd.length).toBe(3);

    expect(utxoOneAmount).toBeInTheDocument();
  });

  it('Test changing output count effects dollar fee and percent fee', async () => {
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

    const customFeeRate = await screen.findByText('Fee rate: 10 sat/vB');
    const utxoOneAmount = await screen.findByText('1.00000000');

    let utxoOneFeeEstimate = await screen.findByText('0.0015%');
    let utxoFeeUsd = await screen.findAllByText('$2');

    expect(customFeeRate).toBeInTheDocument();
    expect(utxoOneFeeEstimate).toBeInTheDocument();
    // a utxo fee usd for all three utxos
    expect(utxoFeeUsd.length).toBe(3);
    expect(utxoOneAmount).toBeInTheDocument();

    const outputCountInput = screen.getByTestId('output-count');
    expect(outputCountInput).toHaveValue('2');

    fireEvent.change(outputCountInput, { target: { value: 500 } });
    // now higher usd fee and fee rate % showing
    utxoOneFeeEstimate = await screen.findByText('0.0929%');
    utxoFeeUsd = await screen.findAllByText('$186');
  });

  it('Test default settings slideout', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
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

    const singleOption = within(slideout).getByRole('radio', {
      name: 'SINGLE',
    });
    const batchOption = within(slideout).getByRole('radio', {
      name: 'BATCH',
    });
    expect(batchOption).not.toBeChecked();
    expect(singleOption).toBeChecked();

    const minFeeRateLabel = within(slideout).getByText('Min fee rate');
    const minFeeRate = minFeeRateLabel.parentNode?.nextSibling
      ?.firstChild as HTMLInputElement;

    expect(minFeeRate?.value).toBe('0');
    const maxFeeRateLabel = within(slideout).getByText('Max fee rate');

    const maxFeeRate = maxFeeRateLabel.parentNode?.nextSibling
      ?.firstChild as HTMLInputElement;

    expect(maxFeeRate?.value).toBe('1,000');
    // test default Colors
    const zeroPercentColor =
      within(slideout).getByDisplayValue('rgb(220, 252, 231)');
    const fivePercentColor =
      within(slideout).getByDisplayValue('rgb(254, 240, 138)');
    const twentyFivePercentColor =
      within(slideout).getByDisplayValue('rgb(239, 68, 68)');
    const fiftyPercentColor =
      within(slideout).getByDisplayValue('rgb(220, 38, 38)');
    const seventyFivePercentColor =
      within(slideout).getByDisplayValue('rgb(185, 28, 28)');
    const hundredPercentColor =
      within(slideout).getByDisplayValue('rgb(153, 27, 27)');
    // test default percents
    const zeroPercent = within(slideout).getByDisplayValue('0%');
    const fivePercent = within(slideout).getByDisplayValue('5%');
    const twentyFivePercent = within(slideout).getByDisplayValue('25%');
    const fiftyPercent = within(slideout).getByDisplayValue('50%');
    const seventyFivePercent = within(slideout).getByDisplayValue('75%');
    const hundredPercent = within(slideout).getByDisplayValue('100%');
    expect(zeroPercent).toBeInTheDocument();
    expect(fivePercent).toBeInTheDocument();
    expect(twentyFivePercent).toBeInTheDocument();
    expect(fiftyPercent).toBeInTheDocument();
    expect(seventyFivePercent).toBeInTheDocument();
    expect(hundredPercent).toBeInTheDocument();

    expect(zeroPercentColor).toBeInTheDocument();
    expect(fivePercentColor).toBeInTheDocument();
    expect(twentyFivePercentColor).toBeInTheDocument();
    expect(fiftyPercentColor).toBeInTheDocument();
    expect(seventyFivePercentColor).toBeInTheDocument();
    expect(hundredPercentColor).toBeInTheDocument();

    const logOutButton = screen.getByRole('button', { name: 'Log out' });
    expect(logOutButton).toBeEnabled();
  });

  it('Test removing and adding settings percent colors', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
    expect(title).toBeInTheDocument();

    const slideoutButton = screen.getByTestId('settings-button');
    fireEvent.click(slideoutButton);

    const settingsTitle = await screen.findByText('Settings');
    expect(settingsTitle).toBeInTheDocument();

    const slideout = screen.getByTestId('settings-slideout');

    // confirm that the five percent color and percent are showing
    let fivePercentColor =
      within(slideout).getByDisplayValue('rgb(254, 240, 138)');
    let fivePercent = within(slideout).getByDisplayValue('5%');
    expect(fivePercentColor).toBeInTheDocument();
    expect(fivePercent).toBeInTheDocument();

    const zeroPctFeeRateColorContainer = within(slideout).getByTestId(
      'fee-rate-color-container-0',
    );
    const zeroPctFeeRateColorContainerButtons = within(
      zeroPctFeeRateColorContainer,
    ).queryAllByRole('button');

    // shouldn't be able to remove the first color/pct.
    expect(zeroPctFeeRateColorContainerButtons).toHaveLength(0);

    // test you can remove the second color/pct
    const fivePctFeeRateColorContainer = within(slideout).getByTestId(
      'fee-rate-color-container-1',
    );
    const fivePctFeeRateColorRemoveButton = within(
      fivePctFeeRateColorContainer,
    ).queryByRole('button');

    fireEvent.click(fivePctFeeRateColorRemoveButton);

    // after removing the second color/pct, it should no longer be showing
    await waitFor(() => {
      fivePercentColor =
        within(slideout).queryByDisplayValue('rgb(254, 240, 138)');
      fivePercent = within(slideout).queryByDisplayValue('5%');
      expect(fivePercentColor).not.toBeInTheDocument();
      expect(fivePercent).not.toBeInTheDocument();
    });

    // test index 5 fee rate color doesn't exist yet
    let fifthPctFeeRateColorContainer = within(slideout).queryByTestId(
      'fee-rate-color-container-5',
    );
    expect(fifthPctFeeRateColorContainer).not.toBeInTheDocument();

    const addFeeRateColorButton =
      within(slideout).getByTestId('add-fee-rate-color');

    fireEvent.click(addFeeRateColorButton);

    // now the index 5 color/pct should be added
    fifthPctFeeRateColorContainer = within(slideout).queryByTestId(
      'fee-rate-color-container-5',
    );
    expect(fifthPctFeeRateColorContainer).toBeInTheDocument();

    // Test the pct and pct color.
    const newPercentColor =
      within(slideout).queryByDisplayValue('rgb(143, 17, 17)');
    const newPercent = within(slideout).queryByDisplayValue('105%');
    expect(newPercentColor).toBeInTheDocument();
    expect(newPercent).toBeInTheDocument();
  });

  it('Test logging out from settings slideout', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
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

      expect(mockNavigate).toHaveBeenCalledWith(Pages.CHOOSE_PATH);
    });
  });

  test('Changing to sats metric settings changes the values being displayed', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
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

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
    expect(title).toBeInTheDocument();

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'current-route',
      Pages.HOME,
    );
  });

  test('Tells main thread to get the wallet data on first render', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
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

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
    expect(title).toBeInTheDocument();

    await waitFor(() => expect(getUtxosSpy).toHaveBeenCalled());

    //  open settings slideout and set batch tx to true
    await setTxTypeToBatched(screen);

    let txCheckBoxes;

    await waitFor(async () => {
      txCheckBoxes = screen.getAllByRole('checkbox');
      // three txs so should be three tx checkboxes to be able to include
      // in our batched tx, as well as a 4th button to include all txs.
      expect(txCheckBoxes?.length).toBe(4);
    });

    const includeAllUtxosButton = txCheckBoxes[0];
    fireEvent.click(includeAllUtxosButton);

    // set output count to 5
    const outputCountMock = 5;
    const outputCountInput = screen.getByTestId('output-count');
    fireEvent.change(outputCountInput, { target: { value: outputCountMock } });

    let estimateBatchTxButton = screen.getByRole('button', {
      name: 'Estimate Batch',
    });

    expect(estimateBatchTxButton).toBeEnabled();

    const selectedTotal = screen.getByText('Count: 3');
    expect(selectedTotal).toBeInTheDocument();

    const BTCSelectedTotal = screen.getByText('BTC: 3.00000001');
    expect(BTCSelectedTotal).toBeInTheDocument();

    const USDSelectedTotal = screen.getByText('USD: $300,000');
    expect(USDSelectedTotal).toBeInTheDocument();

    fireEvent.click(estimateBatchTxButton);

    const expectedData = mockUtXos.map((utxo) => ({
      id: utxo.txid,
      vout: utxo.vout,
      amount: utxo.amount,
    }));
    await waitFor(() => {
      expect(createTxFeeEstimateSpy).toHaveBeenCalledTimes(1);
      expect(createTxFeeEstimateSpy).toHaveBeenCalledWith(
        expectedData,
        10,
        outputCountMock,
      );
    });

    let totalFees = await screen.findByText('Total fees: ~0.15000000 BTC');
    let totalFeeCost = await screen.findByText('Fee cost: $15,000');
    let totalFeePct = await screen.findByText('(5.0000%)');
    expect(totalFees).toBeInTheDocument();
    expect(totalFeeCost).toBeInTheDocument();
    expect(totalFeePct).toBeInTheDocument();

    // change btc price should change the usd fee cost of the batch tx
    const btcPriceInput = await screen.findByTestId('btc-price-input');

    // increase price by a factor of 10
    fireEvent.change(btcPriceInput, { target: { value: '1000000' } });

    // should not change
    totalFees = await screen.findByText('Total fees: ~0.15000000 BTC');
    // should not change
    totalFeePct = await screen.findByText('(5.0000%)');
    // should be higher by around a factor of 10
    totalFeeCost = await screen.findByText('Fee cost: $150,000');

    expect(totalFees).toBeInTheDocument();
    expect(totalFeeCost).toBeInTheDocument();
    expect(totalFeePct).toBeInTheDocument();
  });

  it('Changing output count after batch tx estimate should remove batch tx estimate', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
    expect(title).toBeInTheDocument();

    await waitFor(() => expect(getUtxosSpy).toHaveBeenCalled());

    //  open settings slideout and set batch tx to true
    await setTxTypeToBatched(screen);

    let txCheckBoxes;

    await waitFor(async () => {
      txCheckBoxes = screen.getAllByRole('checkbox');
      // three txs so should be three tx checkboxes to be able to include
      // in our batched tx, as well as a 4th button to include all txs.
      expect(txCheckBoxes?.length).toBe(4);
    });

    const includeAllUtxosButton = txCheckBoxes[0];
    fireEvent.click(includeAllUtxosButton);

    // set output count to 5
    const outputCountMock = 5;
    let outputCountInput = screen.getByTestId('output-count');
    fireEvent.change(outputCountInput, { target: { value: outputCountMock } });

    let estimateBatchTxButton = screen.getByRole('button', {
      name: 'Estimate Batch',
    });

    expect(estimateBatchTxButton).toBeEnabled();

    const selectedTotal = screen.getByText('Count: 3');
    expect(selectedTotal).toBeInTheDocument();

    const BTCSelectedTotal = screen.getByText('BTC: 3.00000001');
    expect(BTCSelectedTotal).toBeInTheDocument();

    const USDSelectedTotal = screen.getByText('USD: $300,000');
    expect(USDSelectedTotal).toBeInTheDocument();

    fireEvent.click(estimateBatchTxButton);

    const expectedData = mockUtXos.map((utxo) => ({
      id: utxo.txid,
      vout: utxo.vout,
      amount: utxo.amount,
    }));
    await waitFor(() => {
      expect(createTxFeeEstimateSpy).toHaveBeenCalledTimes(1);
      expect(createTxFeeEstimateSpy).toHaveBeenCalledWith(
        expectedData,
        10,
        outputCountMock,
      );
    });

    let totalFees = await screen.findByText('Total fees: ~0.15000000 BTC');
    let totalFeeCost = await screen.findByText('Fee cost: $15,000');
    let totalFeePct = await screen.findByText('(5.0000%)');
    expect(totalFees).toBeInTheDocument();
    expect(totalFeeCost).toBeInTheDocument();
    expect(totalFeePct).toBeInTheDocument();

    // change outputs count
    const newOutputCount = outputCountMock + 10;
    fireEvent.change(outputCountInput, { target: { value: newOutputCount } });

    // Fees should now be removed
    totalFees = await screen.findByText('Total fees: ...');
    totalFeeCost = await screen.findByText('Fee cost: ...');

    expect(totalFees).toBeInTheDocument();
    expect(totalFeeCost).toBeInTheDocument();
  });

  it('Importing in wallet data with configs', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <Home />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Custom Fee Environment (sat/vB)');
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

// Open slideout and set batch tx to true, then close slideout
const setTxTypeToBatched = async (screen: any) => {
  //open settings and set batch tx to true
  const slideoutButton = screen.getByTestId('settings-button');
  fireEvent.click(slideoutButton);

  let settingsTitle = await screen.findByText('Settings');
  expect(settingsTitle).toBeInTheDocument();

  const slideout = screen.getByTestId('settings-slideout');
  let batchOption = within(slideout).getByRole('radio', {
    name: 'BATCH',
  });
  fireEvent.click(batchOption);

  batchOption = within(slideout).getByRole('radio', {
    name: 'BATCH',
  });
  expect(batchOption).toBeChecked();

  settingsTitle = await screen.findByText('Settings');
  const closeSlideoutButton = settingsTitle.parentElement
    .nextElementSibling as HTMLButtonElement;

  fireEvent.click(closeSlideoutButton);

  await waitFor(() => {
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });
};
