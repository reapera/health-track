export interface Rumah {
  id: string
  nama: string
  alamat: string
  fotoUrl: string
  catatan: string
}

export interface Penghuni {
  id: string
  nama: string
  nik: string
  noHp: string
  kontakDarurat: string
  hpDarurat: string
  fotoKtp: string
  rumahId: string | null
  rumahNama: string
  kamar: string
  tanggalMasuk: string | null
  jenisSewa: string | null
  status: string | null
}

export interface Pembayaran {
  id: string
  keterangan: string
  penghuniId: string | null
  penghuniNama: string
  periodeMulai: string | null
  periodeSelesai: string | null
  jumlah: number | null
  tanggalBayar: string | null
  statusBayar: string | null
  catatan: string
}

export type ReminderStatus = 'overdue' | 'warning' | 'ok'

export interface PenghuniWithReminder extends Penghuni {
  reminderStatus: ReminderStatus
  nextDue: string | null
  lastPayment: Pembayaran | null
}
