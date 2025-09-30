import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ActivityNotificationProvider } from '@/contexts/ActivityNotificationContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import NotificationContainer from '@/components/NotificationContainer'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'COMMUNITYPLEDGES',
  description: 'Pledge towards community servers and share the costs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <NotificationProvider>
            <CurrencyProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex flex-col">
                <Navbar />
                <main className="container mx-auto px-4 py-8 flex-1">
                  {children}
                </main>
                <Footer />
                <NotificationContainer />
              </div>
            </CurrencyProvider>
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  )
}

