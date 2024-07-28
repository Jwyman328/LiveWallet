import { fireEvent, render, waitFor } from '@testing-library/react';
import { WrappedInAppWrappers, mockElectron } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';
import { ChoosePath } from './ChoosePath';

const mockNavigate = jest.fn();
let getServerHealthStatusSpy: jest.SpyInstance;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ChoosePath', () => {
  beforeEach(() => {
    getServerHealthStatusSpy = jest.spyOn(ApiClient, 'getServerHealthStatus');
    getServerHealthStatusSpy.mockResolvedValue({
      status: 'good',
    });
  });

  afterEach(() => {
    mockNavigate.mockClear();
    mockElectron.ipcRenderer.sendMessage.mockClear();
    mockElectron.ipcRenderer.on.mockClear();
    getServerHealthStatusSpy.mockClear();
  });

  it('All buttons shown correctly and work when called', async () => {
    const screen = render(
      <WrappedInAppWrappers>
        <ChoosePath />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Live Wallet');
    const importButton = await screen.findByRole('button', {
      name: 'Import wallet',
    });
    const enterButton = await screen.findByRole('button', {
      name: 'Enter wallet',
    });
    const hardwareButton = await screen.findByRole('button', {
      name: 'Hardware wallet',
    });

    expect(title).toBeInTheDocument();
    expect(importButton).toBeInTheDocument();
    expect(enterButton).toBeInTheDocument();
    expect(hardwareButton).toBeInTheDocument();

    fireEvent.click(enterButton);
    expect(mockNavigate).toHaveBeenCalledWith('/sign-in');

    fireEvent.click(importButton);

    expect(mockElectron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'import-wallet-from-dialog',
    );

    fireEvent.click(hardwareButton);
    const hardwareWalletModalTitle = await screen.findByText(
      'Connect a Hardware Wallet',
    );
    expect(hardwareWalletModalTitle).toBeInTheDocument();
  });

  it('Bad status response shows error', async () => {
    getServerHealthStatusSpy.mockResolvedValue({
      status: 'bad',
    });
    const screen = render(
      <WrappedInAppWrappers>
        <ChoosePath />
      </WrappedInAppWrappers>,
    );

    await waitFor(() => {
      expect(getServerHealthStatusSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      const title = screen.queryByText('Live Wallet');
      const importButton = screen.queryByRole('button', {
        name: 'Import wallet',
      });
      const enterButton = screen.queryByRole('button', {
        name: 'Enter wallet',
      });
      const hardwareButton = screen.queryByRole('button', {
        name: 'Hardware wallet',
      });

      expect(title).not.toBeInTheDocument();
      expect(importButton).not.toBeInTheDocument();
      expect(enterButton).not.toBeInTheDocument();
      expect(hardwareButton).not.toBeInTheDocument();
    });
  });
});
