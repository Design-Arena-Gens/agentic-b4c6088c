import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Personal Dashboard',
  description: 'Track your schedule, goals, assignments, and reminders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
