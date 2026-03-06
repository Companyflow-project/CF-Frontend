import { AuthProvider } from '@/context/auth-context';
import { AppearanceProvider } from '@/context/appearance-context';
import { AppRouter } from '@/router';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AxiosError } from 'axios';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof AxiosError && error.response?.status === 429) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppearanceProvider>
          <AppRouter />
          <Toaster position="top-right" richColors />
        </AppearanceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;