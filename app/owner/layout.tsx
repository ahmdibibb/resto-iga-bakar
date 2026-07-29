import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Owner Dashboard | Resto Iga Bakar',
  description: 'Strategic oversight and business intelligence dashboard',
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
