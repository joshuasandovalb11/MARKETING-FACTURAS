import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationToastProvider } from './hooks/useNotificationToast';
import { QUERY_RETRY, getRetryDelay } from './utils/queryPolicies';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY,
      retryDelay: getRetryDelay,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1000 * 30,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationToastProvider>
          <Toaster position="bottom-right" richColors closeButton />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </BrowserRouter>
        </NotificationToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
