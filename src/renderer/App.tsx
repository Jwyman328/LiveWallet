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
            <Route path="/sign-in" element={<WalletSignIn />} />
            <Route path="/" element={<ChoosePath />} />
            <Route path="/home" element={<Home />} />
            <Route path="/generate-wallet" element={<GenerateWallet />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </MantineProvider>
  );
}
