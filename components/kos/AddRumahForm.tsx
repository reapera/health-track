'use client'

import { useActionState } from 'react'
import { addRumahAction } from '@/lib/kos/actions'
import SubmitButton from './SubmitButton'

export default function AddRumahForm() {
  const [state, formAction] = useActionState(addRumahAction, null)

  return (
    <details className="bg-gray-900 border border-gray-800 rounded-xl">
      <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 hover:text-white select-none">
        + Tambah Rumah Baru
      </summary>
      <form action={formAction} className="px-4 pb-4 pt-2 border-t border-gray-800">
        {state?.error && (
          <p className="mb-3 text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
            {state.error}
          </p>
        )}
        <div className="grid gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nama Rumah *</label>
            <input
              name="nama"
              required
              placeholder="cth: Kos Depok A"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Alamat</label>
            <input
              name="alamat"
              placeholder="cth: Jl. Margonda No. 5, Depok"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">URL Foto (opsional, pisahkan dengan koma)</label>
            <input
              name="fotoUrl"
              placeholder="https://drive.google.com/..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Catatan</label>
            <input
              name="catatan"
              placeholder="cth: 8 kamar, air PDAM"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
          <div className="flex justify-end pt-1">
            <SubmitButton label="Simpan Rumah" />
          </div>
        </div>
      </form>
    </details>
  )
}
