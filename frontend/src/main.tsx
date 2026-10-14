import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import { HomeListsProvider } from './homeLists/HomeListsContext'
import { InventoryProvider } from './inventory/InventoryContext'
import { ThemeProvider } from './theme/ThemeProvider'
import { UsageProvider } from './usage/UsageContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <HomeListsProvider>
              <InventoryProvider>
                <UsageProvider>
                  <App />
                </UsageProvider>
              </InventoryProvider>
            </HomeListsProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
