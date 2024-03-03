import { useNavigate } from 'react-router-dom';
import { useCreateWallet } from '../hooks/wallet';

export const WalletSignIn = () => {
  const navigate = useNavigate();
  const handleWalletInitiated = () => {
    navigate('/home');
  };
  const handleWalletError = () => {
    console.log('Error initiating wallet');
  };
  const initiateWalletRequest = useCreateWallet(
    'wpkh(tprv8ZgxMBicQKsPcx5nBGsR63Pe8KnRUqmbJNENAfGftF3yuXoMMoVJJcYeUw5eVkm9WBPjWYt6HMWYJNesB5HaNVBaFc1M6dRjWSYnmewUMYy/84h/0h/0h/0/*)',
    handleWalletInitiated,
    handleWalletError,
  );

  const signIn = async () => {
    try {
      await initiateWalletRequest.mutateAsync();
    } catch (e) {
      console.log('Error', e);
    }
  };
  return (
    <div>
      sign in bitch
      <button type="button" onClick={signIn}>
        Sign in here
      </button>
    </div>
  );
};
