export const dynamic = 'force-dynamic'

import { kosDbsConfigured, fetchAllPenghuni, fetchAllPembayaran, fetchAllRumah } from '@/lib/kos/notion'
import { buildReminderList } from '@/lib/kos/utils'
import ReminderCard from '@/components/kos/ReminderCard'

export default async function KosPage() {
  if (!kosDbsConfigured()) {
    return (
      <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-6">
        <h2 className="text-yellow-200 font-semibold mb-3">Setup diperlukan</h2>
        <p className="text-yellow-400 text-sm mb-4">
          Tambahkan variabel berikut ke file <code className="bg-yellow-900 px-1 rounded">.env.local</code>:
        </p>
        <pre className="bg-gray-950 text-emerald-400 text-xs rounded-lg p-4 overflow-x-auto">
          {`NOTION_KOS_HOUSES_DB=<id-database-rumah>\nNOTION_KOS_RENTERS_DB=<id-database-penghuni>\nNOTION_KOS_PAYMENTS_DB=<id-database-pembayaran>`}
        </pre>
        <p className="text-yellow-500 text-xs mt-3">
          Buat 3 database di Notion sesuai skema, bagikan ke integrasi, salin ID database (32 karakter dari URL), lalu restart server.
        </p>
      </div>
    )
  }

  let reminders
  try {
    const [penghuniList, allPembayaran, rumahList] = await Promise.all([
      fetchAllPenghuni(),
      fetchAllPembayaran(),
      fetchAllRumah(),
    ])

    const rumahMap = Object.fromEntries(rumahList.map((r) => [r.id, r.nama]))
    const enriched = penghuniList.map((p) => ({
      ...p,
      rumahNama: p.rumahId ? (rumahMap[p.rumahId] ?? '') : '',
    }))

    reminders = buildReminderList(enriched, allPembayaran)
  } catch (err) {
    return (
      <div className="bg-red-950 border border-red-800 rounded-xl p-6">
        <h2 className="text-red-200 font-semibold mb-2">Gagal memuat data</h2>
        <p className="text-red-400 text-sm">{err instanceof Error ? err.message : 'Unknown error'}</p>
      </div>
    )
  }

  const overdue = reminders.filter((r) => r.reminderStatus === 'overdue')
  const warning = reminders.filter((r) => r.reminderStatus === 'warning')
  const ok = reminders.filter((r) => r.reminderStatus === 'ok')

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3">
            Terlambat ({overdue.length})
          </h2>
          <div className="space-y-2">
            {overdue.map((p) => <ReminderCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {warning.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-3">
            Jatuh Tempo dalam 30 Hari ({warning.length})
          </h2>
          <div className="space-y-2">
            {warning.map((p) => <ReminderCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {ok.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pembayaran Aman ({ok.length})
          </h2>
          <div className="space-y-2">
            {ok.map((p) => <ReminderCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {reminders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏠</p>
          <p className="text-gray-400">Belum ada penghuni aktif.</p>
          <p className="text-gray-600 text-sm mt-1">Tambahkan penghuni di tab Penghuni.</p>
        </div>
      )}
    </div>
  )
}
