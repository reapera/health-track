'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createRumah,
  createPenghuni,
  createPembayaran,
  updatePenghuniStatus,
  fetchPenghuniById,
} from './notion'

type ActionState = { error: string } | null

export async function addRumahAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const nama = (formData.get('nama') as string)?.trim()
  const alamat = (formData.get('alamat') as string)?.trim() ?? ''
  const fotoUrl = (formData.get('fotoUrl') as string)?.trim() ?? ''
  const catatan = (formData.get('catatan') as string)?.trim() ?? ''

  if (!nama) return { error: 'Nama rumah wajib diisi.' }

  try {
    await createRumah({ nama, alamat, fotoUrl, catatan })
  } catch {
    return { error: 'Gagal menyimpan ke Notion. Periksa konfigurasi dan coba lagi.' }
  }

  revalidatePath('/kos/rumah')
  redirect('/kos/rumah')
}

export async function addPenghuniAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const nama = (formData.get('nama') as string)?.trim()
  const nik = (formData.get('nik') as string)?.trim() ?? ''
  const noHp = (formData.get('noHp') as string)?.trim() ?? ''
  const kontakDarurat = (formData.get('kontakDarurat') as string)?.trim() ?? ''
  const hpDarurat = (formData.get('hpDarurat') as string)?.trim() ?? ''
  const fotoKtp = (formData.get('fotoKtp') as string)?.trim() ?? ''
  const rumahId = (formData.get('rumahId') as string)?.trim()
  const kamar = (formData.get('kamar') as string)?.trim() ?? ''
  const tanggalMasuk = (formData.get('tanggalMasuk') as string)?.trim()
  const jenisSewa = (formData.get('jenisSewa') as string)?.trim()

  if (!nama) return { error: 'Nama penghuni wajib diisi.' }
  if (!rumahId) return { error: 'Pilih rumah terlebih dahulu.' }
  if (!tanggalMasuk) return { error: 'Tanggal masuk wajib diisi.' }
  if (!jenisSewa) return { error: 'Pilih jenis sewa.' }
  if (nik && !/^\d{16}$/.test(nik)) return { error: 'NIK harus 16 digit angka.' }

  try {
    await createPenghuni({ nama, nik, noHp, kontakDarurat, hpDarurat, fotoKtp, rumahId, kamar, tanggalMasuk, jenisSewa })
  } catch {
    return { error: 'Gagal menyimpan ke Notion. Periksa konfigurasi dan coba lagi.' }
  }

  revalidatePath('/kos/penghuni')
  redirect('/kos/penghuni')
}

export async function addPembayaranAction(
  penghuniId: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const periodeMulai = (formData.get('periodeMulai') as string)?.trim()
  const periodeSelesai = (formData.get('periodeSelesai') as string)?.trim()
  const jumlahStr = (formData.get('jumlah') as string)?.trim()
  const tanggalBayar = (formData.get('tanggalBayar') as string)?.trim()
  const statusBayar = (formData.get('statusBayar') as string)?.trim() ?? 'Lunas'
  const catatan = (formData.get('catatan') as string)?.trim() ?? ''

  if (!periodeMulai || !periodeSelesai) return { error: 'Periode pembayaran wajib diisi.' }
  if (!jumlahStr || isNaN(Number(jumlahStr))) return { error: 'Jumlah pembayaran tidak valid.' }
  if (!tanggalBayar) return { error: 'Tanggal bayar wajib diisi.' }

  const jumlah = Number(jumlahStr)

  let penghuniNama = ''
  try {
    const penghuni = await fetchPenghuniById(penghuniId)
    penghuniNama = penghuni?.nama ?? ''
    await createPembayaran({ penghuniId, penghuniNama, periodeMulai, periodeSelesai, jumlah, tanggalBayar, statusBayar, catatan })
  } catch {
    return { error: 'Gagal menyimpan ke Notion. Periksa konfigurasi dan coba lagi.' }
  }

  revalidatePath(`/kos/penghuni/${penghuniId}`)
  revalidatePath('/kos')
  redirect(`/kos/penghuni/${penghuniId}`)
}

export async function togglePenghuniStatusAction(penghuniId: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'Aktif' ? 'Keluar' : 'Aktif'
  await updatePenghuniStatus(penghuniId, newStatus)
  revalidatePath('/kos/penghuni')
  revalidatePath(`/kos/penghuni/${penghuniId}`)
  revalidatePath('/kos')
}
