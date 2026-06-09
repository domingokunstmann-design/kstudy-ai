'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Play, Pause, RotateCcw, Coffee, Brain, X, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'

type Mode = 'work' | 'break'

const DEFAULT_WORK = 25
const DEFAULT_BREAK = 5

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('work')
  const [workMins, setWorkMins] = useState(DEFAULT_WORK)
  const [breakMins, setBreakMins] = useState(DEFAULT_BREAK)
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_WORK * 60)
  const [running, setRunning] = useState(false)
  const [cycle, setCycle] = useState(1)
  const [expanded, setExpanded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = mode === 'work' ? workMins * 60 : breakMins * 60
  const progress = 1 - secondsLeft / totalSeconds

  const modeColor  = mode === 'work' ? '#7c6af7' : '#4ade80'
  const modeBg     = mode === 'work' ? 'rgba(124,106,247,0.1)'  : 'rgba(74,222,128,0.08)'
  const modeBorder = mode === 'work' ? 'rgba(124,106,247,0.25)' : 'rgba(74,222,128,0.2)'

  const switchMode = useCallback((nextMode: Mode) => {
    setMode(nextMode)
    setSecondsLeft(nextMode === 'work' ? workMins * 60 : breakMins * 60)
    setRunning(false)
  }, [workMins, breakMins])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            const next: Mode = mode === 'work' ? 'break' : 'work'
            if (mode === 'break') setCycle(c => c + 1)
            switchMode(next)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, switchMode])

  // Esc cierra el modo pantalla completa
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleReset() {
    setRunning(false)
    setSecondsLeft(mode === 'work' ? workMins * 60 : breakMins * 60)
  }

  // ── Modo pantalla completa ──────────────────────────────────
  if (fullscreen) {
    const fsRadius = 140
    const fsCircumference = 2 * Math.PI * fsRadius
    const fsOffset = fsCircumference * (1 - progress)

    const overlay = (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center select-none"
        style={{ background: mode === 'work' ? '#07050f' : '#050a05' }}
      >
        {/* Botón salir */}
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-5 right-5 p-2.5 rounded-xl opacity-30 hover:opacity-70 transition-opacity"
          style={{ color: 'white' }}
        >
          <Minimize2 className="w-5 h-5" />
        </button>

        {/* Modo + ciclo */}
        <p className="text-sm font-semibold uppercase tracking-widest mb-10 opacity-40" style={{ color: modeColor }}>
          {mode === 'work' ? '🧠 Enfocado' : '☕ Descansando'} · Ciclo #{cycle}
        </p>

        {/* Círculo grande */}
        <div className="relative mb-10">
          <svg width="320" height="320" className="-rotate-90">
            <circle cx="160" cy="160" r={fsRadius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
            <circle
              cx="160" cy="160" r={fsRadius} fill="none"
              stroke={modeColor} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={fsCircumference}
              strokeDashoffset={fsOffset}
              style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 12px ${modeColor}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-mono font-bold"
              style={{ color: modeColor, fontSize: '72px', lineHeight: 1, letterSpacing: '-2px' }}
            >
              {fmt(secondsLeft)}
            </span>
            <span className="text-sm font-medium mt-2 opacity-30 text-white">
              {mode === 'work' ? `${workMins} min de trabajo` : `${breakMins} min de descanso`}
            </span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl transition-opacity opacity-30 hover:opacity-60"
            style={{ color: 'white' }}
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            onClick={() => setRunning(r => !r)}
            className="w-20 h-20 rounded-3xl flex items-center justify-center transition-all hover:scale-105"
            style={{ background: modeColor, boxShadow: `0 0 40px ${modeColor}55` }}
          >
            {running
              ? <Pause className="w-8 h-8 text-white" />
              : <Play className="w-8 h-8 text-white ml-1" />
            }
          </button>

          <button
            onClick={() => switchMode(mode === 'work' ? 'break' : 'work')}
            className="p-3 rounded-2xl transition-opacity opacity-30 hover:opacity-60"
            style={{ color: 'white' }}
            title="Cambiar modo"
          >
            {mode === 'work' ? <Coffee className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
          </button>
        </div>

        <p className="mt-12 text-xs opacity-20 text-white">Presiona Esc para salir</p>
      </div>
    )
    return createPortal(overlay, document.body)
  }

  // ── Modo colapsado (chip) ───────────────────────────────────
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
        style={{ background: modeBg, border: `1px solid ${modeBorder}`, color: modeColor }}
      >
        {mode === 'work' ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
        <span className="font-mono text-xs">{fmt(secondsLeft)}</span>
        {running && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: modeColor }} />}
      </button>
    )
  }

  // ── Modo expandido (widget en sidebar) ─────────────────────
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: modeBg, border: `1px solid ${modeBorder}` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${modeBorder}` }}>
        <div className="flex items-center gap-2">
          {mode === 'work'
            ? <Brain className="w-3.5 h-3.5" style={{ color: modeColor }} />
            : <Coffee className="w-3.5 h-3.5" style={{ color: modeColor }} />
          }
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: modeColor }}>
            {mode === 'work' ? 'Pomodoro' : 'Descanso'} · #{cycle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFullscreen(true)}
            className="p-1 rounded hover:bg-white/5 transition-colors"
            title="Pantalla completa"
          >
            <Maximize2 className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
          </button>
          <button onClick={() => setExpanded(false)} className="p-1 rounded hover:bg-white/5">
            <X className="w-3.5 h-3.5 text-white/30" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Círculo de progreso */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <svg width="96" height="96" className="-rotate-90">
              <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle
                cx="48" cy="48" r={radius} fill="none"
                stroke={modeColor} strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xl font-bold" style={{ color: modeColor }}>
                {fmt(secondsLeft)}
              </span>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRunning(r => !r)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:opacity-90"
              style={{ background: modeColor }}
            >
              {running ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
            </button>
            <button
              onClick={() => switchMode(mode === 'work' ? 'break' : 'work')}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              title="Cambiar modo"
            >
              {mode === 'work' ? <Coffee className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Duración configurable */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-white/30 text-center mb-1">Trabajo</p>
            <div className="flex items-center justify-center gap-1.5">
              <button onClick={() => {
                if (workMins > 5) {
                  const next = workMins - 5
                  setWorkMins(next)
                  if (mode === 'work' && !running) setSecondsLeft(next * 60)
                }
              }} className="p-0.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-white/60 w-8 text-center">{workMins}m</span>
              <button onClick={() => {
                if (workMins < 60) {
                  const next = workMins + 5
                  setWorkMins(next)
                  if (mode === 'work' && !running) setSecondsLeft(next * 60)
                }
              }} className="p-0.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex-1">
            <p className="text-[10px] text-white/30 text-center mb-1">Descanso</p>
            <div className="flex items-center justify-center gap-1.5">
              <button onClick={() => {
                if (breakMins > 1) {
                  const next = breakMins - 1
                  setBreakMins(next)
                  if (mode === 'break' && !running) setSecondsLeft(next * 60)
                }
              }} className="p-0.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono text-white/60 w-8 text-center">{breakMins}m</span>
              <button onClick={() => {
                if (breakMins < 30) {
                  const next = breakMins + 1
                  setBreakMins(next)
                  if (mode === 'break' && !running) setSecondsLeft(next * 60)
                }
              }} className="p-0.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
