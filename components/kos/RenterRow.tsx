import Link from 'next/link'
import type { Penghuni } from '@/lib/kos/types'
import { formatTanggal } from '@/lib/kos/utils'

export default function RenterRow({ p }: { p: Penghuni }) {
  const isAktif = p.status === 'Aktif'
  return (
    <Link
      href={`/kos/penghuni/${p.id}`}
      className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-800/60 transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{p.nama}</p>
        <p className="text-xs text-gray-400 truncate">
          {p.rumahNama ? `${p.rumahNama} · ` : ''}{p.kamar}
          {p.tanggalMasuk ? ` · Masuk ${formatTanggal(p.tanggalMasuk)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {p.jenisSewa && (
          <span className="hidden sm:block text-xs text-gray-500">{p.jenisSewa}</span>
        )}
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isAktif ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'
          }`}
        >
          {p.status ?? '—'}
        </span>
      </div>
    </Link>
  )
}
