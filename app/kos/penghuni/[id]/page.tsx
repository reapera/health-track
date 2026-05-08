export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchPenghuniById, fetchPembayaranByPenghuni, fetchAllRumah } from '@/lib/kos/notion'
import { togglePenghuniStatusAction } from '@/lib/kos/actions'
import { formatTanggal, formatIDR, getNextDue } from '@/lib/kos/utils'
import PaymentHistoryTable from '@/components/kos/PaymentHistoryTable'
import AddPembayaranForm from '@/components/kos/AddPembayaranForm'

export default async function PenghuniDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params

  const [penghuni, payments, rumahList] = await Promise.all([
    fetchPenghuniById(id),
    fetchPembayaranByPenghuni(id),
    fetchAllRumah(),
  ])

  if (!penghuni) notFound()

  const rumahMap = Object.fromEntries(rumahList.map((r) => [r.id, r.nama]))
  const rumahNama = penghuni.rumahId ? (rumahMap[penghuni.rumahId] ?? '') : ''

  const { nextDue, reminderStatus } = getNextDue(payments)

  const statusColors = {
    overdue: 'text-red-400',
    warning: 'text-yellow-400',
    ok: 'text-emerald-400',
  }

  const toggleAction = togglePenghuniStatusAction.bind(null, penghuni.id, penghuni.status ?? 'Aktif')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/kos/penghuni" className="hover:text-white transition-colors">← Penghuni</Link>
      </div>

      {/* Renter info card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{penghuni.nama}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {rumahNama && `${rumahNama} · `}{penghuni.kamar}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                penghuni.status === 'Aktif'
                  ? 'bg-emerald-900/50 text-emerald-400'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {penghuni.status ?? '—'}
            </span>
            <form action={toggleAction}>
              <button
                type="submit"
                className="text-xs text-gray-500 hover:text-white underline transition-colors"
              >
                {penghuni.status === 'Aktif' ? 'Tandai Keluar' : 'Aktifkan Kembali'}
              </button>
            </form>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {penghuni.nik && (
            <Info label="NIK" value={penghuni.nik} />
          )}
          {penghuni.noHp && (
            <Info label="No. HP" value={penghuni.noHp} />
          )}
          {penghuni.kontakDarurat && (
            <Info label="Kontak Darurat" value={`${penghuni.kontakDarurat}${penghuni.hpDarurat ? ` · ${penghuni.hpDarurat}` : ''}`} />
          )}
          {penghuni.tanggalMasuk && (
            <Info label="Tanggal Masuk" value={formatTanggal(penghuni.tanggalMasuk)} />
          )}
          {penghuni.jenisSewa && (
            <Info label="Jenis Sewa" value={penghuni.jenisSewa} />
          )}
          {penghuni.fotoKtp && (
            <div className="flex gap-2">
              <span className="text-gray-500">Foto KTP:</span>
              <a href={penghuni.fotoKtp} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                Lihat Foto
              </a>
            </div>
          )}
        </div>

        {nextDue && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              Jatuh tempo berikutnya:{' '}
              <span className={`font-medium ${statusColors[reminderStatus]}`}>
                {formatTanggal(nextDue)}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Payment summary */}
      {payments.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total sudah dibayar</p>
          <p className="text-2xl font-bold text-emerald-400">
            {formatIDR(payments.filter(p => p.statusBayar === 'Lunas').reduce((s, p) => s + (p.jumlah ?? 0), 0))}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">{payments.filter(p => p.statusBayar === 'Lunas').length} kali pembayaran lunas</p>
        </div>
      )}

      {/* Add payment form */}
      <AddPembayaranForm penghuniId={id} />

      {/* Payment history */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Riwayat Pembayaran</h3>
        <PaymentHistoryTable payments={payments} />
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="text-gray-200">{value}</span>
    </div>
  )
}
