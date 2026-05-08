'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
    >
      {pending ? 'Menyimpan...' : label}
    </button>
  )
}
