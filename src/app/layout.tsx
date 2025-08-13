import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Baby Goats - Build Your Legacy',
  description: 'The ultimate platform for the next generation of champions. Every GOAT was once a Baby Goat.',
  keywords: 'youth sports, athletes, recruiting, character development, basketball, football, soccer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}