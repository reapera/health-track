'use client'

import { useActionState } from 'react'
import { addPembayaranAction } from '@/lib/kos/actions'
import SubmitButton from './SubmitButton'

export default function AddPembayaranForm({ penghuniId }: { penghuniId: string }) {
  const boundAction = addPembayaranAction.bind(null, penghuniId)
  const [state, formAction] = useActionState(boundAction, null)

  return (
    <details className="bg-gray-900 border border-gray-800 rounded-xl">
      <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 hover:text-white select-none">
        + Catat Pembayaran Baru
      </summary>
      <form action={formAction} className="px-4 pb-4 pt-2 border-t border-gray-800">
        {state?.error && (
          <p className="mb-3 text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Periode Mulai *</label>
            <input
              name="periodeMulai"
              type="date"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Periode Selesai *</label>
            <input
              name="periodeSelesai"
              type="date"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Jumlah (Rp) *</label>
            <input
              name="jumlah"
              type="number"
              required
              min={0}
              step={50000}
              placeholder="cth: 1500000"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tanggal Bayar *</label>
            <input
              name="tanggalBayar"
              type="date"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              name="statusBayar"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            >
              <option value="Lunas">Lunas</option>
              <option value="Belum Lunas">Belum Lunas</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Catatan</label>
            <input
              name="catatan"
              placeholder="cth: Transfer BCA, bukti no. 12345"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>
        <div className="flex justify-end pt-3">
          <SubmitButton label="Catat Pembayaran" />
        </div>
      </form>
    </details>
  )
}
