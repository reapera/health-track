import type { Rumah } from '@/lib/kos/types'

export default function HouseCard({ rumah, occupancy }: { rumah: Rumah; occupancy: number }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-white">{rumah.nama}</h3>
        <span className="shrink-0 text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
          {occupancy} penghuni aktif
        </span>
      </div>
      {rumah.alamat && (
        <p className="text-sm text-gray-400 mb-1">{rumah.alamat}</p>
      )}
      {rumah.catatan && (
        <p className="text-xs text-gray-500 italic">{rumah.catatan}</p>
      )}
      {rumah.fotoUrl && (
        <div className="mt-3 flex flex-wrap gap-2">
          {rumah.fotoUrl.split(',').map((url, i) => (
            <a
              key={i}
              href={url.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:underline"
            >
              Foto {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
