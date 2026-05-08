export const dynamic = 'force-dynamic'

import { kosDbsConfigured, fetchAllRumah, fetchAllPenghuni } from '@/lib/kos/notion'
import HouseCard from '@/components/kos/HouseCard'
import AddRumahForm from '@/components/kos/AddRumahForm'

export default async function RumahPage() {
  if (!kosDbsConfigured()) {
    return <p className="text-yellow-400 text-sm">Database belum dikonfigurasi. Lihat tab Pengingat.</p>
  }

  let rumahList
  let occupancyMap: Record<string, number> = {}

  try {
    const [rumah, penghuni] = await Promise.all([fetchAllRumah(), fetchAllPenghuni()])
    rumahList = rumah
    for (const p of penghuni) {
      if (p.status === 'Aktif' && p.rumahId) {
        occupancyMap[p.rumahId] = (occupancyMap[p.rumahId] ?? 0) + 1
      }
    }
  } catch (err) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-xl p-6">
        <p className="text-red-400 text-sm">{err instanceof Error ? err.message : 'Gagal memuat data'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AddRumahForm />
      {rumahList.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">Belum ada rumah. Tambah rumah pertama Anda di atas.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {rumahList.map((r) => (
            <HouseCard key={r.id} rumah={r} occupancy={occupancyMap[r.id] ?? 0} />
          ))}
        </div>
      )}
    </div>
  )
}
