import type { Pembayaran } from '@/lib/kos/types'
import { formatIDR, formatTanggal } from '@/lib/kos/utils'

export default function PaymentHistoryTable({ payments }: { payments: Pembayaran[] }) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">Belum ada riwayat pembayaran.</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
            <th className="text-left pb-2 pr-4">Periode</th>
            <th className="text-left pb-2 pr-4">Tanggal Bayar</th>
            <th className="text-right pb-2 pr-4">Jumlah</th>
            <th className="text-left pb-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {payments.map((p) => (
            <tr key={p.id} className="text-gray-300">
              <td className="py-2.5 pr-4">
                {p.periodeMulai && p.periodeSelesai
                  ? `${formatTanggal(p.periodeMulai)} – ${formatTanggal(p.periodeSelesai)}`
                  : '—'}
              </td>
              <td className="py-2.5 pr-4">
                {p.tanggalBayar ? formatTanggal(p.tanggalBayar) : '—'}
              </td>
              <td className="py-2.5 pr-4 text-right font-medium text-emerald-400">
                {p.jumlah != null ? formatIDR(p.jumlah) : '—'}
              </td>
              <td className="py-2.5">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.statusBayar === 'Lunas'
                      ? 'bg-emerald-900/50 text-emerald-400'
                      : 'bg-yellow-900/50 text-yellow-400'
                  }`}
                >
                  {p.statusBayar ?? '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
