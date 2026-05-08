import type { Pembayaran, Penghuni, PenghuniWithReminder, ReminderStatus } from './types'

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatTanggal(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(dateStr + 'T00:00:00'))
}

export function getNextDue(pembayaranList: Pembayaran[]): {
  nextDue: string | null
  reminderStatus: ReminderStatus
} {
  const lunas = pembayaranList
    .filter((p) => p.statusBayar === 'Lunas' && p.periodeSelesai)
    .sort((a, b) => (b.periodeSelesai! > a.periodeSelesai! ? 1 : -1))

  if (lunas.length === 0) {
    return { nextDue: null, reminderStatus: 'overdue' }
  }

  const nextDueDate = new Date(lunas[0].periodeSelesai! + 'T00:00:00')
  nextDueDate.setDate(nextDueDate.getDate() + 1)
  const nextDue = nextDueDate.toISOString().split('T')[0]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((nextDueDate.getTime() - today.getTime()) / 86_400_000)

  let reminderStatus: ReminderStatus = 'ok'
  if (diffDays < 0) reminderStatus = 'overdue'
  else if (diffDays <= 30) reminderStatus = 'warning'

  return { nextDue, reminderStatus }
}

export function buildReminderList(
  penghuniList: Penghuni[],
  allPembayaran: Pembayaran[]
): PenghuniWithReminder[] {
  return penghuniList
    .filter((p) => p.status === 'Aktif')
    .map((penghuni) => {
      const myPayments = allPembayaran.filter((p) => p.penghuniId === penghuni.id)
      const { nextDue, reminderStatus } = getNextDue(myPayments)
      const lastPayment =
        myPayments
          .filter((p) => p.statusBayar === 'Lunas' && p.periodeSelesai)
          .sort((a, b) => (b.periodeSelesai! > a.periodeSelesai! ? 1 : -1))[0] ?? null
      return { ...penghuni, reminderStatus, nextDue, lastPayment }
    })
    .sort((a, b) => {
      const order: Record<ReminderStatus, number> = { overdue: 0, warning: 1, ok: 2 }
      return order[a.reminderStatus] - order[b.reminderStatus]
    })
}
