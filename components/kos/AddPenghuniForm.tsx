'use client'

import { useActionState } from 'react'
import { addPenghuniAction } from '@/lib/kos/actions'
import type { Rumah } from '@/lib/kos/types'
import SubmitButton from './SubmitButton'

export default function AddPenghuniForm({ rumahList }: { rumahList: Rumah[] }) {
  const [state, formAction] = useActionState(addPenghuniAction, null)

  return (
    <details className="bg-gray-900 border border-gray-800 rounded-xl">
      <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 hover:text-white select-none">
        + Tambah Penghuni Baru
      </summary>
      <form action={formAction} className="px-4 pb-4 pt-2 border-t border-gray-800">
        {state?.error && (
          <p className="mb-3 text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nama Lengkap *</label>
            <input
              name="nama"
              required
              placeholder="Nama sesuai KTP"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">NIK (eKTP, 16 digit)</label>
            <input
              name="nik"
              maxLength={16}
              placeholder="3201234567890001"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">No. HP / WhatsApp</label>
            <input
              name="noHp"
              placeholder="08xxxxxxxxxx"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Foto KTP (URL)</label>
            <input
              name="fotoKtp"
              placeholder="https://drive.google.com/..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nama Kontak Darurat</label>
            <input
              name="kontakDarurat"
              placeholder="cth: Budi Santoso (Ayah)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">HP Kontak Darurat</label>
            <input
              name="hpDarurat"
              placeholder="08xxxxxxxxxx"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rumah *</label>
            <select
              name="rumahId"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            >
              <option value="">— Pilih Rumah —</option>
              {rumahList.map((r) => (
                <option key={r.id} value={r.id}>{r.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nomor / Label Kamar</label>
            <input
              name="kamar"
              placeholder="cth: Kamar 3"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tanggal Masuk *</label>
            <input
              name="tanggalMasuk"
              type="date"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Jenis Sewa *</label>
            <select
              name="jenisSewa"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-600"
            >
              <option value="">— Pilih —</option>
              <option value="Tahunan">Tahunan</option>
              <option value="Setengah Tahun">Setengah Tahun</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-3">
          <SubmitButton label="Simpan Penghuni" />
        </div>
      </form>
    </details>
  )
}
