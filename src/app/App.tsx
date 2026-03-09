import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { CompanyProvider } from '@/context/CompanyContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Router } from '@/routes/Router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CompanyProvider>
            <Router />
            <Toaster richColors position="top-center" />
          </CompanyProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
