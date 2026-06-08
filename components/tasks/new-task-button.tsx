'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { NewTaskForm } from './new-task-form'

export function NewTaskButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Nueva tarea</span>
      </button>

      {open && <NewTaskForm onClose={() => setOpen(false)} />}
    </>
  )
}
