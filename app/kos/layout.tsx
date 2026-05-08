import KosNav from '@/components/kos/KosNav'

export const metadata = {
  title: 'Kos Manager',
  description: 'Manajemen kos dan pembayaran sewa',
}

export default function KosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-white mb-4">Manajemen Kos</h1>
      <KosNav />
      {children}
    </div>
  )
}
