import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import '@mantine/notifications/styles.css';

import '@mantine/core/styles.css';

import { createTheme, MantineProvider } from '@mantine/core';

import { WalletSignIn } from '../app/pages/WalletSignIn';
import Home from '../app/pages/Home';
import { QueryClient, QueryClientProvider } from 'react-query';
import { GenerateWallet } from '../app/pages/GenerateWallet';
import { ChoosePath } from '../app/pages/ChoosePath';
import { Notifications } from '@mantine/notifications';
import { Pages } from './pages';

const queryClient = new QueryClient();

const theme = createTheme({
  /** Put your mantine theme override here */
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Notifications position="top-right" />
        <Router>
          <Routes>
            <Route path={Pages.SIGN_IN} element={<WalletSignIn />} />
            <Route path={Pages.CHOOSE_PATH} element={<ChoosePath />} />
            <Route path={Pages.HOME} element={<Home />} />
            <Route path={Pages.GENERATE_WALLET} element={<GenerateWallet />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </MantineProvider>
  );
}
