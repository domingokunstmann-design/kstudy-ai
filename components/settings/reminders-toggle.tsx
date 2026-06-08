'use client'

import { useState, useTransition } from 'react'
import { toggleReminders } from '@/lib/actions/settings'

export function RemindersToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const next = !on
    setOn(next)
    startTransition(async () => {
      await toggleReminders(next)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
      style={{
        background: on ? '#6366f1' : 'rgba(255,255,255,0.1)',
        opacity: pending ? 0.6 : 1,
      }}
      aria-label="Toggle recordatorios"
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? 'translateX(1.375rem)' : 'translateX(0.25rem)' }}
      />
    </button>
  )
}
