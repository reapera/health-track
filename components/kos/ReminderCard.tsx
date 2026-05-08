import Link from 'next/link'
import type { PenghuniWithReminder } from '@/lib/kos/types'
import { formatIDR, formatTanggal } from '@/lib/kos/utils'

const styles = {
  overdue: {
    card: 'bg-red-950 border border-red-800',
    badge: 'bg-red-900 text-red-300',
    label: 'text-red-400',
    name: 'text-red-100',
  },
  warning: {
    card: 'bg-yellow-950 border border-yellow-800',
    badge: 'bg-yellow-900 text-yellow-300',
    label: 'text-yellow-400',
    name: 'text-yellow-100',
  },
  ok: {
    card: 'bg-gray-900 border border-gray-800',
    badge: 'bg-gray-800 text-gray-300',
    label: 'text-gray-400',
    name: 'text-white',
  },
}

export default function ReminderCard({ p }: { p: PenghuniWithReminder }) {
  const s = styles[p.reminderStatus]

  const dueLabel =
    p.nextDue === null
      ? 'Belum ada pembayaran tercatat'
      : p.reminderStatus === 'overdue'
      ? `Jatuh tempo sejak ${formatTanggal(p.nextDue)}`
      : `Jatuh tempo ${formatTanggal(p.nextDue)}`

  const statusLabel =
    p.reminderStatus === 'overdue'
      ? 'Terlambat'
      : p.reminderStatus === 'warning'
      ? 'Segera'
      : 'Aman'

  return (
    <Link href={`/kos/penghuni/${p.id}`} className={`block rounded-xl p-4 hover:opacity-90 transition-opacity ${s.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${s.name}`}>{p.nama}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.badge}`}>{statusLabel}</span>
          </div>
          <p className={`text-xs ${s.label}`}>
            {p.rumahNama ? `${p.rumahNama} · ` : ''}{p.kamar}
          </p>
          <p className={`text-xs mt-1 ${s.label}`}>{dueLabel}</p>
        </div>
        {p.lastPayment?.jumlah != null && (
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500">Terakhir bayar</p>
            <p className="text-sm font-medium text-emerald-400">{formatIDR(p.lastPayment.jumlah)}</p>
          </div>
        )}
      </div>
    </Link>
  )
}
