import { MantineProvider, createTheme } from '@mantine/core';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';

const queryClient = new QueryClient();

const theme = createTheme({
  /** Put your mantine theme override here */
});

export const WrappedInAppWrappers = ({ children }: { children: ReactNode }) => {
  return (
    <MantineProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={children} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </MantineProvider>
  );
};

const sendMock = jest.fn();
const sendMessageMock = jest.fn();
const onMock = jest.fn();
const getCurrentWindowMock = jest.fn();
const getVersionMock = jest.fn();
export const mockElectron = {
  ipcRenderer: {
    sendMessage: sendMessageMock,
    send: sendMock,
    on: onMock,
  },
  remote: {
    getCurrentWindow: getCurrentWindowMock,
    app: {
      getVersion: getVersionMock,
    },
  },
  matchMedia: jest.fn(),
};
