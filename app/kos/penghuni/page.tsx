export const dynamic = 'force-dynamic'

import { kosDbsConfigured, fetchAllPenghuni, fetchAllRumah } from '@/lib/kos/notion'
import RenterRow from '@/components/kos/RenterRow'
import AddPenghuniForm from '@/components/kos/AddPenghuniForm'

export default async function PenghuniPage() {
  if (!kosDbsConfigured()) {
    return <p className="text-yellow-400 text-sm">Database belum dikonfigurasi. Lihat tab Pengingat.</p>
  }

  let penghuniList
  let rumahList
  try {
    ;[penghuniList, rumahList] = await Promise.all([fetchAllPenghuni(), fetchAllRumah()])
  } catch (err) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-xl p-6">
        <p className="text-red-400 text-sm">{err instanceof Error ? err.message : 'Gagal memuat data'}</p>
      </div>
    )
  }

  const rumahMap = Object.fromEntries(rumahList.map((r) => [r.id, r.nama]))
  const enriched = penghuniList.map((p) => ({
    ...p,
    rumahNama: p.rumahId ? (rumahMap[p.rumahId] ?? '') : '',
  }))

  const aktif = enriched.filter((p) => p.status === 'Aktif')
  const keluar = enriched.filter((p) => p.status !== 'Aktif')

  return (
    <div className="space-y-4">
      <AddPenghuniForm rumahList={rumahList} />

      {enriched.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">Belum ada penghuni. Tambah penghuni di atas.</p>
      ) : (
        <>
          {aktif.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <p className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-800">
                Aktif ({aktif.length})
              </p>
              <div className="divide-y divide-gray-800/60">
                {aktif.map((p) => <RenterRow key={p.id} p={p} />)}
              </div>
            </div>
          )}
          {keluar.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <p className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-800">
                Sudah Keluar ({keluar.length})
              </p>
              <div className="divide-y divide-gray-800/60">
                {keluar.map((p) => <RenterRow key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
