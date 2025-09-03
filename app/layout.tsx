import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Providers } from '@/components/providers'
import { Toaster } from "sonner"
import './globals.css'

export const metadata: Metadata = {
  title: 'Face Attendance System',
  description: 'Modern attendance system using face recognition technology for educational institutions',
  generator: 'Next.js',
  keywords: ['attendance', 'face recognition', 'education', 'biometric', 'AI'],
  authors: [{ name: 'Face Attendance System' }],
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
        `}</style>
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}