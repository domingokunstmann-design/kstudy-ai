'use client'

import { useState } from 'react'
import { signOut } from '@/lib/actions/auth'
import { getInitials } from '@/lib/utils'
import { LogOut, User, ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'
import Image from 'next/image'

interface UserMenuProps {
  profile: Profile
}

export function UserMenu({ profile }: UserMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? 'Avatar'}
              width={28}
              height={28}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-indigo-400">
              {getInitials(profile.full_name)}
            </span>
          )}
        </div>

        {/* Nombre */}
        <div className="text-left hidden sm:block">
          <p className="text-xs font-medium text-zinc-200 leading-none truncate max-w-[120px]">
            {profile.full_name ?? 'Usuario'}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[120px]">
            {profile.email}
          </p>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Overlay para cerrar */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/50 z-50 overflow-hidden">
            {/* Info del usuario */}
            <div className="px-3 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name ?? 'Avatar'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-indigo-400">
                      {getInitials(profile.full_name)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-100 truncate max-w-[140px]">
                    {profile.full_name ?? 'Usuario'}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                    {profile.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menú items */}
            <div className="p-1">
              <a
                href="/dashboard/settings"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                onClick={() => setOpen(false)}
              >
                <User className="w-3.5 h-3.5" />
                Perfil y configuración
              </a>

              <div className="border-t border-zinc-800 mt-1 pt-1">
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
