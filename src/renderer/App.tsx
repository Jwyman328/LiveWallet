import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import { WalletSignIn } from '../app/pages/WalletSignIn';
import Home from '../app/pages/Home';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<WalletSignIn />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
