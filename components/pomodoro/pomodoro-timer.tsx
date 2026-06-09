'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, X, ChevronUp, ChevronDown } from 'lucide-react'

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

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRunningRef = useRef(false)

  const totalSeconds = mode === 'work' ? workMins * 60 : breakMins * 60
  const progress = 1 - secondsLeft / totalSeconds

  const switchMode = useCallback((nextMode: Mode) => {
    setMode(nextMode)
    setSecondsLeft(nextMode === 'work' ? workMins * 60 : breakMins * 60)
    setRunning(false)
    isRunningRef.current = false
  }, [workMins, breakMins])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            // Auto-switch
            const next: Mode = mode === 'work' ? 'break' : 'work'
            if (mode === 'break') setCycle(c => c + 1)
            switchMode(next)
            // Sound notification
            try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...').play() } catch {}
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

  function handleReset() {
    setRunning(false)
    setSecondsLeft(mode === 'work' ? workMins * 60 : breakMins * 60)
  }

  function handlePlayPause() {
    setRunning(r => !r)
  }

  // Circular progress
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const modeColor = mode === 'work' ? '#7c6af7' : '#4ade80'
  const modeBg    = mode === 'work' ? 'rgba(124,106,247,0.1)' : 'rgba(74,222,128,0.08)'
  const modeBorder= mode === 'work' ? 'rgba(124,106,247,0.25)' : 'rgba(74,222,128,0.2)'

  if (!expanded) {
    // Collapsed: mini chip en la esquina
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
        style={{ background: modeBg, border: `1px solid ${modeBorder}`, color: modeColor }}
        title="Abrir Pomodoro"
      >
        {mode === 'work' ? <Brain className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
        <span className="font-mono text-xs">{fmt(secondsLeft)}</span>
        {running && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: modeColor }} />}
      </button>
    )
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: modeBg, border: `1px solid ${modeBorder}` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${modeBorder}` }}
      >
        <div className="flex items-center gap-2">
          {mode === 'work'
            ? <Brain className="w-3.5 h-3.5" style={{ color: modeColor }} />
            : <Coffee className="w-3.5 h-3.5" style={{ color: modeColor }} />
          }
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: modeColor }}>
            {mode === 'work' ? 'Pomodoro' : 'Descanso'} · #{cycle}
          </span>
        </div>
        <button onClick={() => setExpanded(false)} className="p-1 rounded hover:bg-white/5">
          <X className="w-3.5 h-3.5 text-white/30" />
        </button>
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
            <button onClick={handleReset}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:opacity-90"
              style={{ background: modeColor }}
            >
              {running
                ? <Pause className="w-4 h-4 text-white" />
                : <Play className="w-4 h-4 text-white ml-0.5" />
              }
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
