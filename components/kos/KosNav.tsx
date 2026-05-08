'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/kos', label: 'Pengingat', exact: true },
  { href: '/kos/penghuni', label: 'Penghuni', exact: false },
  { href: '/kos/rumah', label: 'Rumah', exact: false },
]

export default function KosNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b border-gray-800 mb-6">
      {tabs.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              active
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
