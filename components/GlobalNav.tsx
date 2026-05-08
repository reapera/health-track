'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function GlobalNav() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Kesehatan', exact: true },
    { href: '/kos', label: 'Kos', exact: false },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 flex gap-1 h-12 items-center">
        <span className="text-gray-500 text-sm font-medium mr-3">Dashboard</span>
        {links.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
