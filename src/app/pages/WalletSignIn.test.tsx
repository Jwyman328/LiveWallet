import { render } from '@testing-library/react';
import { WalletSignIn } from './WalletSignIn';
import { WrappedInAppWrappers } from '../testingUtils';
import '@testing-library/jest-dom';
import { ApiClient } from '../api/api';

describe('WalletSignIn', () => {
  test('Wallet sign in displays correctly', async () => {
    jest
      .spyOn(ApiClient, 'getServerHealthStatus')
      .mockResolvedValue({ status: 'good' });

    const screen = render(
      <WrappedInAppWrappers>
        <WalletSignIn />
      </WrappedInAppWrappers>,
    );

    const title = await screen.findByText('Setup');
    // TODO add rest of test

    expect(title).toBeInTheDocument();
  });
});
