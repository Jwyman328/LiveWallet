import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import '@mantine/core/styles.css';

import { createTheme, MantineProvider } from '@mantine/core';

import { WalletSignIn } from '../app/pages/WalletSignIn';
import Home from '../app/pages/Home';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

const theme = createTheme({
  /** Put your mantine theme override here */
});

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<WalletSignIn />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </MantineProvider>
  );
}
