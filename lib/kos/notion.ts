import { Client } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { Rumah, Penghuni, Pembayaran } from './types'

type FullEntry = PageObjectResponse

const notion = new Client({ auth: process.env.NOTION_TOKEN })

const NOTION_API = 'https://api.notion.com/v1'

function headers() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }
}

export const KOS_DB = {
  rumah: process.env.NOTION_KOS_HOUSES_DB ?? '',
  penghuni: process.env.NOTION_KOS_RENTERS_DB ?? '',
  pembayaran: process.env.NOTION_KOS_PAYMENTS_DB ?? '',
}

export function kosDbsConfigured(): boolean {
  return Boolean(KOS_DB.rumah && KOS_DB.penghuni && KOS_DB.pembayaran)
}

function getText(page: FullEntry, key: string): string {
  const prop = page.properties[key]
  if (!prop) return ''
  if (prop.type === 'rich_text') return prop.rich_text.map((r) => r.plain_text).join('')
  if (prop.type === 'title') return prop.title.map((r) => r.plain_text).join('')
  return ''
}

function getNumber(page: FullEntry, key: string): number | null {
  const prop = page.properties[key]
  if (!prop || prop.type !== 'number') return null
  return prop.number
}

function getDate(page: FullEntry, key: string): string | null {
  const prop = page.properties[key]
  if (!prop || prop.type !== 'date' || !prop.date) return null
  return prop.date.start
}

function getSelect(page: FullEntry, key: string): string | null {
  const prop = page.properties[key]
  if (!prop || prop.type !== 'select' || !prop.select) return null
  return prop.select.name
}

function getRelationId(page: FullEntry, key: string): string | null {
  const prop = page.properties[key]
  if (!prop || prop.type !== 'relation' || prop.relation.length === 0) return null
  return prop.relation[0].id
}

async function queryAll(databaseId: string, filter?: object, sorts?: object[]): Promise<FullEntry[]> {
  const results: FullEntry[] = []
  let cursor: string | undefined

  do {
    const body: Record<string, unknown> = { page_size: 100 }
    if (filter) body.filter = filter
    if (sorts) body.sorts = sorts
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      throw new Error(err.message ?? `Notion API error ${res.status}`)
    }
    const data = await res.json() as { results: FullEntry[]; has_more: boolean; next_cursor: string | null }
    results.push(...data.results.filter((p) => p.object === 'page'))
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined
  } while (cursor)

  return results
}

export async function fetchAllRumah(): Promise<Rumah[]> {
  const pages = await queryAll(KOS_DB.rumah, undefined, [
    { property: 'Nama', direction: 'ascending' },
  ])
  return pages.map((p) => ({
    id: p.id,
    nama: getText(p, 'Nama'),
    alamat: getText(p, 'Alamat'),
    fotoUrl: getText(p, 'Foto URL'),
    catatan: getText(p, 'Catatan'),
  }))
}

export async function fetchAllPenghuni(): Promise<Penghuni[]> {
  const pages = await queryAll(KOS_DB.penghuni, undefined, [
    { property: 'Nama', direction: 'ascending' },
  ])
  return pages.map((p) => ({
    id: p.id,
    nama: getText(p, 'Nama'),
    nik: getText(p, 'NIK'),
    noHp: getText(p, 'No. HP'),
    kontakDarurat: getText(p, 'Kontak Darurat'),
    hpDarurat: getText(p, 'HP Darurat'),
    fotoKtp: getText(p, 'Foto KTP'),
    rumahId: getRelationId(p, 'Rumah'),
    rumahNama: '',
    kamar: getText(p, 'Kamar'),
    tanggalMasuk: getDate(p, 'Tanggal Masuk'),
    jenisSewa: getSelect(p, 'Jenis Sewa'),
    status: getSelect(p, 'Status'),
  }))
}

export async function fetchPenghuniById(id: string): Promise<Penghuni | null> {
  try {
    const page = (await notion.pages.retrieve({ page_id: id })) as FullEntry
    return {
      id: page.id,
      nama: getText(page, 'Nama'),
      nik: getText(page, 'NIK'),
      noHp: getText(page, 'No. HP'),
      kontakDarurat: getText(page, 'Kontak Darurat'),
      hpDarurat: getText(page, 'HP Darurat'),
      fotoKtp: getText(page, 'Foto KTP'),
      rumahId: getRelationId(page, 'Rumah'),
      rumahNama: '',
      kamar: getText(page, 'Kamar'),
      tanggalMasuk: getDate(page, 'Tanggal Masuk'),
      jenisSewa: getSelect(page, 'Jenis Sewa'),
      status: getSelect(page, 'Status'),
    }
  } catch {
    return null
  }
}

export async function fetchAllPembayaran(): Promise<Pembayaran[]> {
  const pages = await queryAll(KOS_DB.pembayaran, undefined, [
    { property: 'Tanggal Bayar', direction: 'descending' },
  ])
  return pages.map(mapPembayaran)
}

export async function fetchPembayaranByPenghuni(penghuniId: string): Promise<Pembayaran[]> {
  const pages = await queryAll(
    KOS_DB.pembayaran,
    { property: 'Penghuni', relation: { contains: penghuniId } },
    [{ property: 'Periode Mulai', direction: 'descending' }]
  )
  return pages.map(mapPembayaran)
}

function mapPembayaran(p: FullEntry): Pembayaran {
  return {
    id: p.id,
    keterangan: getText(p, 'Keterangan'),
    penghuniId: getRelationId(p, 'Penghuni'),
    penghuniNama: '',
    periodeMulai: getDate(p, 'Periode Mulai'),
    periodeSelesai: getDate(p, 'Periode Selesai'),
    jumlah: getNumber(p, 'Jumlah'),
    tanggalBayar: getDate(p, 'Tanggal Bayar'),
    statusBayar: getSelect(p, 'Status'),
    catatan: getText(p, 'Catatan'),
  }
}

export async function createRumah(data: {
  nama: string
  alamat: string
  fotoUrl: string
  catatan: string
}): Promise<void> {
  await notion.pages.create({
    parent: { database_id: KOS_DB.rumah },
    properties: {
      Nama: { title: [{ type: 'text', text: { content: data.nama } }] },
      Alamat: { rich_text: [{ type: 'text', text: { content: data.alamat } }] },
      'Foto URL': { rich_text: [{ type: 'text', text: { content: data.fotoUrl } }] },
      Catatan: { rich_text: [{ type: 'text', text: { content: data.catatan } }] },
    },
  })
}

export async function createPenghuni(data: {
  nama: string
  nik: string
  noHp: string
  kontakDarurat: string
  hpDarurat: string
  fotoKtp: string
  rumahId: string
  kamar: string
  tanggalMasuk: string
  jenisSewa: string
}): Promise<void> {
  await notion.pages.create({
    parent: { database_id: KOS_DB.penghuni },
    properties: {
      Nama: { title: [{ type: 'text', text: { content: data.nama } }] },
      NIK: { rich_text: [{ type: 'text', text: { content: data.nik } }] },
      'No. HP': { rich_text: [{ type: 'text', text: { content: data.noHp } }] },
      'Kontak Darurat': { rich_text: [{ type: 'text', text: { content: data.kontakDarurat } }] },
      'HP Darurat': { rich_text: [{ type: 'text', text: { content: data.hpDarurat } }] },
      'Foto KTP': { rich_text: [{ type: 'text', text: { content: data.fotoKtp } }] },
      Rumah: { relation: [{ id: data.rumahId }] },
      Kamar: { rich_text: [{ type: 'text', text: { content: data.kamar } }] },
      'Tanggal Masuk': { date: { start: data.tanggalMasuk } },
      'Jenis Sewa': { select: { name: data.jenisSewa } },
      Status: { select: { name: 'Aktif' } },
    },
  })
}

export async function createPembayaran(data: {
  penghuniId: string
  penghuniNama: string
  periodeMulai: string
  periodeSelesai: string
  jumlah: number
  tanggalBayar: string
  statusBayar: string
  catatan: string
}): Promise<void> {
  const keterangan = `${data.penghuniNama} – ${data.periodeMulai}`
  await notion.pages.create({
    parent: { database_id: KOS_DB.pembayaran },
    properties: {
      Keterangan: { title: [{ type: 'text', text: { content: keterangan } }] },
      Penghuni: { relation: [{ id: data.penghuniId }] },
      'Periode Mulai': { date: { start: data.periodeMulai } },
      'Periode Selesai': { date: { start: data.periodeSelesai } },
      Jumlah: { number: data.jumlah },
      'Tanggal Bayar': { date: { start: data.tanggalBayar } },
      Status: { select: { name: data.statusBayar } },
      Catatan: { rich_text: [{ type: 'text', text: { content: data.catatan } }] },
    },
  })
}

export async function updatePenghuniStatus(penghuniId: string, status: 'Aktif' | 'Keluar'): Promise<void> {
  await notion.pages.update({
    page_id: penghuniId,
    properties: {
      Status: { select: { name: status } },
    },
  })
}
