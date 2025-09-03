'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Remove the devtools import since it's causing issues
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { useState } from 'react'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry up to 3 times for other errors
          return failureCount < 3
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="top-right" />
      </ThemeProvider>
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <div>
          {/* Devtools removed to fix import error */}
          {/* You can install @tanstack/react-query-devtools separately if needed */}
        </div>
      )}
    </QueryClientProvider>
  )
}