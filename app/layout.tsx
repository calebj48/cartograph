import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Cartograph',
  description: 'Research note organization and knowledge mapping',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col">
        <Nav />
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
      </body>
    </html>
  )
}
