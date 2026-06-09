# Kstudy AI — Estrategia de Producto 2026
**Autor:** Domingo Kunstmann  
**Fecha:** Junio 2026  
**Rol:** PM Senior · Diseño UX · Arquitectura de Software

---

## 1. Estado actual de Kstudy

### Lo que ya existe y funciona

Tras auditar el codebase completo, Kstudy tiene una base técnica sólida y bien estructurada:

- **Stack:** Next.js 15 + Supabase + Vercel. RLS configurado correctamente, índices de BD bien diseñados, revalidación por ruta.
- **IA:** `callGemini()` centralizado, `plan-advisor.ts` con prompt engineering de alta calidad, `temario-parser.ts` funcional.
- **Algoritmo de planificación:** `generateStudyPlan()` robusto — respeta horario escolar, rutinas, prioridad por tipo, horas máximas diarias.
- **Dashboard:** Stats en tiempo real, widget "¿Qué estudiar ahora?", progreso semanal, onboarding contextual.
- **Analytics:** Gráfico de 12 semanas, distribución por asignatura, racha de estudio, 12 logros XP, insights de hábitos.
- **Integraciones:** Gmail sync incremental (historyId), Google OAuth, recordatorios vía Resend/cron.
- **Calendario:** Vista mensual/semanal/diaria, horario escolar con colores, detección de zona horaria.

### Gaps críticos identificados en el código

1. **No existe `grade_level` en la tabla `profiles`** — todos los usuarios reciben la misma experiencia.
2. **No hay seguimiento de notas** — la tabla `tasks` no tiene campo `grade` ni `grade_percentage`.
3. **El onboarding es un banner dismissable** — no hay flujo estructurado de configuración inicial.
4. **No existe "Índice de Riesgo Académico"** — está toda la data para calcularlo pero no se usa.
5. **"Classroom" aparece como Inactivo** en el dashboard pero el código de integración existe (`classroom/page.tsx`).
6. **Sin diferenciación por etapa escolar** — el mismo menú, las mismas funciones para todos.
7. **Sin Timer Pomodoro** — los competidores lo tienen como feature diferenciador.
8. **Sin subtareas** — la gestión de tareas es de un nivel, sin desglose.

---

## 2. Auditoría comparativa vs. competidores

### Tabla de benchmarking

| Función | Kstudy | MyStudyLife | Notion | Motion | Reclaim AI | Todoist | Google Classroom | School Planner |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Gestión de tareas académicas | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Sincronización Gmail | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Parseo de temarios con IA | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Planificador de estudio con IA | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Horario escolar | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Calendario integrado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics académico | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ |
| Sistema de XP y logros | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| Racha de estudio | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Insights de hábitos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Widget "Estudiar Ahora" | ✅ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Recordatorios por email | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Seguimiento de notas | ❌ | ✅+ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Cálculo de promedio | ❌ | ✅+ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Timer Pomodoro | ❌ | ✅+ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Subtareas | ❌ | ✅+ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Horarios rotativos A/B | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Diferenciación por nivel escolar | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Onboarding progresivo | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| App nativa móvil | ⚠️ PWA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enfoque chileno (NEM/PAES/sistema de notas) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modo Supervivencia / sobrecarga | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Índice de riesgo académico | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Coach académico inteligente | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Timetable scan (foto del horario) | ❌ | ✅+ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Leyenda:** ✅ Completo · ⚠️ Parcial · ❌ No existe · ✅+ Solo en versión premium

### Conclusiones del benchmarking

**Ventajas únicas de Kstudy** (nadie más las tiene combinadas):
- Sincronización Gmail con detección automática de fechas
- Parseo de temarios con IA
- Planificador de estudio con IA que respeta el horario escolar
- Gamificación académica real (XP + logros + racha)
- Enfoque en reducir el caos (no solo organizar)

**Brechas críticas vs. competidores** (donde Kstudy pierde usuarios):
- Sin seguimiento de notas — es la función #1 que busca un estudiante de enseñanza media
- Sin Pomodoro — MyStudyLife lo tiene y genera mucho engagement
- Sin diferenciación escolar — oportunidad única de diferenciación
- Onboarding incompleto — la curva de adopción es alta

**Oportunidad exclusiva para Kstudy** (ningún competidor la cubre):
- Sistema de notas chileno (escala 1-7, ponderación NEM, PAES)
- Experiencia adaptativa por nivel (7°-8° vs. I-II vs. III-IV)
- Índice de riesgo académico accionable

---

## 3. Diferenciación por etapa escolar

### Diseño del sistema de perfiles

**Implementación técnica requerida:**
```sql
-- Migración 006_grade_profile.sql
ALTER TABLE public.profiles ADD COLUMN grade_level TEXT; 
-- valores: '7mo' | '8vo' | '1ro_medio' | '2do_medio' | '3ro_medio' | '4to_medio'
ALTER TABLE public.profiles ADD COLUMN school_name TEXT;
ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
```

El `grade_level` se solicita durante el onboarding (paso 1, obligatorio). Si el email institucional contiene el nivel, se puede pre-rellenar con IA.

---

### Perfil 1: 7° y 8° Básico

**Filosofía:** Organización gamificada. El estudiante aprende a usar una agenda digital por primera vez.

**Mostrar:**
- Dashboard simplificado — solo tareas próximas y plan de hoy
- Horario de clases (visual, con colores llamativos)
- Calendario de pruebas
- Sistema de XP y logros (protagonista, no secundario)
- Racha de estudio
- Widget "¿Qué hago ahora?" (más grande y prominente)
- Recordatorios push (si PWA) y email

**Ocultar completamente:**
- Analytics complejos (reemplazar por un resumen simple: "Esta semana completaste X tareas")
- NEM y PAES
- Proyecciones universitarias
- Seguimiento de notas avanzado (solo nota de cada evaluación, sin promedios ponderados)

**Tono UX:** Energético, motivador, positivo. Mensajes como "¡Vas genial!" y "Ya le queda menos a esa prueba."

---

### Perfil 2: I° y II° Medio

**Filosofía:** Rendimiento académico. El estudiante empieza a preocuparse de sus notas y promedios.

**Agregar a todo lo de Perfil 1:**
- Seguimiento de notas por asignatura
- Cálculo de promedio actual
- Simulación: "¿Qué nota necesito en la próxima prueba para llegar a X?"
- Alertas de riesgo: "Tu promedio en Matemáticas está bajo 5.0 — hay una evaluación en 8 días"
- Analytics por asignatura (gráfico de evolución de notas)
- Meta de promedio semestral

**Tono UX:** Más maduro, orientado a metas. Mensajes como "Vas en camino a tu meta en Lenguaje" o "Atención: Biología necesita refuerzo esta semana."

---

### Perfil 3: III° y IV° Medio

**Filosofía:** Proyección universitaria. El estudiante piensa en la PAES y el NEM.

**Agregar a todo lo de Perfil 2:**
- NEM actualizado en tiempo real (calculado desde las notas ingresadas)
- Simulador de NEM: "Si terminas el semestre con promedio X, tu NEM queda en Y"
- Seguimiento de ensayos PAES (fecha, puntaje, área)
- Proyección de puntaje PAES: basada en progresión de ensayos
- Electivos y sus ponderaciones
- Metas universitarias (carrera + institución + puntaje de corte estimado)
- Comparador de requisitos de carrera vs. proyección actual

**Tono UX:** Estratégico, realista. Mensajes como "Tu NEM proyectado es 6.1 — necesitas sostener un promedio de 6.0 este semestre."

---

## 4. Sistema de seguimiento de notas (contexto chileno)

### Diseño de la base de datos

```sql
-- Migración 007_grades.sql

CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                    -- "Matemáticas", "Lenguaje"
  color TEXT DEFAULT 'indigo',
  teacher_name TEXT,
  semester INTEGER DEFAULT 1,            -- 1 o 2
  school_year INTEGER DEFAULT 2026,
  coefficient NUMERIC DEFAULT 1.0,       -- para NEM ponderado
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL, -- vinculada a tarea
  title TEXT NOT NULL,                   -- "Prueba Unidad 3", "Control"
  grade NUMERIC(3,1) NOT NULL,           -- 1.0 a 7.0
  percentage NUMERIC(5,2) DEFAULT NULL,  -- porcentaje de la nota en el ramo (ej: 30%)
  graded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grades_user_id ON public.grades(user_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
```

### Cálculo de promedio

El promedio se calcula en el frontend con lógica simple:

```typescript
// lib/grades/calculator.ts
export function calculateAverage(grades: Grade[]): number | null {
  if (!grades.length) return null
  
  const hasPercentages = grades.every(g => g.percentage != null)
  
  if (hasPercentages) {
    // Promedio ponderado
    const total = grades.reduce((sum, g) => sum + (g.grade * g.percentage!), 0)
    const weights = grades.reduce((sum, g) => sum + g.percentage!, 0)
    return weights > 0 ? total / weights : null
  }
  
  // Promedio simple
  return grades.reduce((sum, g) => sum + g.grade, 0) / grades.length
}

export function gradeNeededForTarget(
  currentGrades: Grade[],
  targetAverage: number,
  remainingEvaluationsWeight: number  // % del total que aún falta evaluar
): number | null {
  if (remainingEvaluationsWeight <= 0) return null
  const currentWeight = 100 - remainingEvaluationsWeight
  const currentWeightedAvg = calculateAverage(currentGrades) ?? 0
  // target = (currentAvg * currentWeight + needed * remainingWeight) / 100
  // needed = (target * 100 - currentAvg * currentWeight) / remainingWeight
  return (targetAverage * 100 - currentWeightedAvg * currentWeight) / remainingEvaluationsWeight
}
```

### Cálculo de NEM

```typescript
export function calculateNEM(
  subjects: Subject[],  // con coefficient y average
  semester: 1 | 2
): number | null {
  // NEM = promedio ponderado por coeficiente de todas las asignaturas
  const withGrades = subjects.filter(s => s.average != null)
  if (!withGrades.length) return null
  const weighted = withGrades.reduce((sum, s) => sum + s.average! * s.coefficient, 0)
  const totalCoef = withGrades.reduce((sum, s) => sum + s.coefficient, 0)
  return Math.round((weighted / totalCoef) * 10) / 10
}
```

---

## 5. Nuevas funciones priorizadas

### 5.1 Índice de Riesgo Académico (SEMÁFORO)

**Qué resuelve:** Los estudiantes no saben cuándo están en problemas hasta que es tarde.

**Cómo funciona:** Score calculado 100% con datos que ya existen en Kstudy, sin llamadas IA adicionales.

```typescript
// lib/risk/calculator.ts

interface RiskFactors {
  overdueTasks: number          // tareas vencidas sin completar
  tasksDueIn3Days: number       // tareas que vencen en 3 días
  evalsDueIn7Days: number       // evaluaciones en 7 días
  studySessionsMissedThisWeek: number  // sesiones planificadas no completadas
  studyStreakDays: number        // racha actual
  avgCompletionRate: number     // % tareas completadas en últimas 4 semanas
}

export function calculateRiskIndex(factors: RiskFactors): {
  level: 'low' | 'moderate' | 'high'
  score: number  // 0-100
  reasons: string[]
} {
  let score = 0
  const reasons: string[] = []

  // Factores de riesgo
  if (factors.overdueTasks > 0) {
    score += Math.min(factors.overdueTasks * 15, 40)
    reasons.push(`${factors.overdueTasks} tarea${factors.overdueTasks > 1 ? 's' : ''} vencida${factors.overdueTasks > 1 ? 's' : ''}`)
  }
  if (factors.evalsDueIn7Days >= 3) {
    score += 20
    reasons.push(`${factors.evalsDueIn7Days} evaluaciones esta semana`)
  } else if (factors.evalsDueIn7Days >= 2) {
    score += 10
    reasons.push(`${factors.evalsDueIn7Days} evaluaciones próximas`)
  }
  if (factors.tasksDueIn3Days >= 3) {
    score += 15
    reasons.push(`${factors.tasksDueIn3Days} tareas urgentes`)
  }
  if (factors.studySessionsMissedThisWeek >= 3) {
    score += 15
    reasons.push('Pocas sesiones de estudio completadas')
  }
  if (factors.avgCompletionRate < 0.5) {
    score += 10
    reasons.push('Tasa de completitud baja')
  }

  // Factores protectores
  if (factors.studyStreakDays >= 5) score -= 10
  if (factors.avgCompletionRate >= 0.8) score -= 10

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    level: score >= 60 ? 'high' : score >= 30 ? 'moderate' : 'low',
    reasons,
  }
}
```

**UI:** Widget en el dashboard. Un círculo con semáforo y 1-2 líneas de contexto. Menos de 5 segundos para entenderlo.

```
┌─────────────────────────────┐
│  🟡 Riesgo moderado         │
│  2 evaluaciones esta semana │
│  Ver plan de rescate →      │
└─────────────────────────────┘
```

**Complejidad:** Baja. Solo SQL + lógica JS. Sin llamadas IA.  
**Impacto:** Alto. Es el diferenciador más visible del dashboard.

---

### 5.2 Timer Pomodoro integrado

**Qué resuelve:** Los estudiantes pierden el foco al estudiar. MyStudyLife lo tiene como feature premium.

**Implementación:** Componente cliente puro. Sin backend, sin BD. Timer en memoria.

```tsx
// components/pomodoro/pomodoro-timer.tsx
// Estado: 'work' | 'break' | 'idle'
// Duraciones configurables: 25min trabajo / 5min pausa
// Vinculado opcionalmente a una sesión de estudio activa
// Al terminar un ciclo de trabajo → marcar sesión como completada
```

**No se necesita:** ninguna migración de BD, ninguna API nueva. Solo un componente React con un `setInterval`.

**Complejidad:** Muy baja. 1 día de desarrollo.  
**Impacto:** Alto en retención y engagement. Es una de las features más buscadas.

---

### 5.3 Modo Supervivencia

**Qué resuelve:** Cuando hay demasiadas evaluaciones juntas, el estudiante entra en pánico y no sabe por dónde empezar.

**Cómo funciona:**
1. Se activa automáticamente cuando el Índice de Riesgo es ALTO (score ≥ 60)
2. O manualmente desde el dashboard con un botón "Modo Supervivencia"
3. Llama a Gemini con la lista de evaluaciones próximas y pide un plan de rescate de 3-5 pasos concretos
4. Muestra el plan en una modal o página dedicada

```typescript
// lib/ai/survival-mode.ts
const SURVIVAL_PROMPT = `
Eres un coach académico de emergencia. El estudiante tiene:
- Evaluaciones en los próximos 7 días: ${evals}
- Horas disponibles de estudio: ${availableHours}
- Hoy es: ${today}

Genera un plan de rescate URGENTE. Máximo 5 pasos concretos. 
Prioriza por impacto en nota final. 
Sé directo: "Hoy: estudia X por 1 hora. Mañana: repasa Y por 45 min."
No uses más de 100 palabras en total.
Responde en JSON: { "steps": ["...", "..."], "priority_subject": "..." }
`
```

**Complejidad:** Media-baja. Reutiliza `callGemini()` ya existente. UI es una modal simple.  
**Impacto:** Alto. Momento de máxima necesidad del usuario — alto valor emocional.

---

### 5.4 Onboarding estructurado (reemplaza el banner)

**Qué resuelve:** El banner actual es fácil de ignorar. La adopción real depende de los primeros 5 minutos.

**Flujo nuevo:**
```
Paso 0 (obligatorio, solo primera vez):
  - Seleccionar nivel escolar (7°-8° / I-II / III-IV)
  - Nombre del colegio (opcional)
  → Guarda grade_level en profiles

Paso 1 (guiado, skip posible):
  - Sincronizar Gmail → detecta tareas automáticamente
  → Si sincroniza: muestra las tareas detectadas inmediatamente

Paso 2 (guiado, skip posible):
  - Configurar horario de clases → planificador más preciso
  → Selector visual de días y horarios

Paso 3 (opcional):
  - Generar primer plan de estudio
  → Muestra el resultado en vivo

[Completar más tarde]
```

**Criterio de éxito:** El estudiante ve tareas reales en menos de 2 minutos desde el primer login.

**Complejidad:** Media. Es rediseño de UI, no lógica nueva. Requiere `onboarding_completed` en `profiles`.  
**Impacto:** Muy alto. La retención del D1 (primer día) es el predictor más fuerte de retención a 30 días.

---

### 5.5 Registro de notas (nuevo módulo)

**Qué resuelve:** Es la función que más buscan los estudiantes de enseñanza media. Sin esto, Kstudy no es suficiente para III-IV medio.

**Pantalla nueva: `/dashboard/grades`**
- Lista de asignaturas con promedio actual
- Por asignatura: lista de notas ingresadas
- Botón "Agregar nota" → modal con: asignatura, título, nota (1.0-7.0), porcentaje (opcional)
- Vinculación opcional a una tarea existente ("Esta nota corresponde a...")
- Cálculo automático del promedio
- Simulador: "¿Qué necesito para llegar a X?"

**Para III-IV medio (si grade_level detectado):**
- NEM proyectado visible en el módulo
- Meta de NEM configurable

**Complejidad:** Media. Requiere migración SQL (simple) + nueva página + 2-3 componentes.  
**Impacto:** Muy alto. Es el gap más crítico vs. competidores y la necesidad #1 del segmento escolar.

---

### 5.6 Coach Académico (mejora del Widget "Estudiar Ahora")

**Qué resuelve:** El widget actual muestra qué sesión está activa, pero no da contexto ni urgencia.

**Evolución del widget:** En lugar de solo "Estudiar X a las HH:MM", el coach dice:

```
┌──────────────────────────────────────┐
│  Coach Académico                     │
│                                      │
│  📚 Ahora: Matemáticas – Límites     │
│     Sesión de 45 min. ¡Empieza ya!  │
│  ⚠️  Biología en riesgo              │
│     Promedio actual: 4.8             │
│     Prueba en 5 días                 │
│  ✅  Hoy completaste 1 sesión         │
│     Racha: 4 días 🔥                 │
└──────────────────────────────────────┘
```

**Implementación:** Evolucionar `StudyNowWidget` con datos del módulo de notas + índice de riesgo. Sin IA adicional — todo calculado.

**Complejidad:** Baja. Componente existente + lógica JS simple.  
**Impacto:** Alto en retención diaria.

---

### 5.7 Alertas inteligentes (notificaciones accionables)

**Qué resuelve:** Los recordatorios actuales son fijos. Las alertas inteligentes detectan patrones.

**Tipos de alerta nuevas (calculadas por el cron existente):**

| Alerta | Trigger | Acción sugerida |
|---|---|---|
| "Semana sobrecargada" | 3+ evaluaciones en 7 días | Ver plan de estudio ajustado |
| "Sin estudiar 3 días" | 0 sesiones completadas en 3 días | Abrir planificador |
| "Tarea urgente ignorada" | Tarea urgente sin tocar hace 2 días | Ir a tareas |
| "Promedio en riesgo" | Nota < 5.0 en asignatura + prueba próxima | Ver coach académico |
| "Racha en peligro" | No hay sesión completada hoy y son las 19:00 | Sesión rápida de 20 min |

**Delivery:** Email vía Resend (cron existente) + en-app notification center (nuevo componente, sin servicio externo).

**Complejidad:** Media. Requiere lógica de detección de patrones en el cron + plantillas de email nuevas.  
**Impacto:** Alto en retención.

---

## 6. Roadmap de implementación

### Fase 1 — Máximo impacto, mínimo esfuerzo (2-4 semanas)

Todo lo de esta fase reutiliza infraestructura existente. Sin migraciones complejas, sin nuevas dependencias.

**1.1 Índice de Riesgo Académico**
- Lógica JS pura + datos que ya se fetchen en el dashboard
- Widget visual en la columna derecha del dashboard
- Tiempo estimado: 1-2 días

**1.2 Timer Pomodoro**
- Componente cliente puro, sin backend
- Accesible desde el planificador y desde las sesiones de estudio
- Tiempo estimado: 1 día

**1.3 Onboarding con selección de nivel escolar**
- Página `/onboarding` que reemplaza el banner
- Migración SQL simple: `grade_level` en `profiles`
- Tiempo estimado: 2-3 días

**1.4 Evolución del Coach Académico (widget mejorado)**
- Sin IA adicional — datos calculados localmente
- Tiempo estimado: 1 día

**Impacto de Fase 1:** Diferenciación inmediata vs. MyStudyLife. El semáforo y el Pomodoro son features que los usuarios van a compartir en redes.

---

### Fase 2 — Impacto alto, esfuerzo medio (1-2 meses)

**2.1 Módulo de Notas (base)**
- Migración SQL (`subjects` + `grades`)
- Página `/dashboard/grades`
- Componentes: `SubjectCard`, `GradeForm`, `AverageDisplay`, `GradeSimulator`
- Tiempo estimado: 1 semana

**2.2 Modo Supervivencia**
- Llama a Gemini con prompt nuevo
- Modal de plan de rescate
- Activación automática por Índice de Riesgo ≥ 60
- Tiempo estimado: 2-3 días

**2.3 Alertas inteligentes (detección de patrones)**
- Lógica nueva en el cron existente
- 5 nuevas plantillas de email
- In-app notification center
- Tiempo estimado: 1 semana

**2.4 Experiencia adaptativa por nivel (UI)**
- Usar `grade_level` para mostrar/ocultar secciones del sidebar
- Mensajes contextuales por perfil
- Tiempo estimado: 2-3 días

---

### Fase 3 — Impacto alto, esfuerzo alto (futuras versiones)

**3.1 NEM y proyección universitaria (III-IV medio)**
- Requiere: módulo de notas completado (Fase 2.1) + coeficientes por asignatura
- Calculadora de NEM proyectado
- Integración con puntajes de corte históricos (fuente pública del DEMRE)
- Tiempo estimado: 2 semanas

**3.2 Seguimiento de ensayos PAES**
- Tabla `paes_trials` (fecha, área, puntaje total, desglose por área)
- Gráfico de progresión de puntaje
- Proyección estadística simple (regresión lineal de los últimos 3 ensayos)
- Tiempo estimado: 1 semana

**3.3 Scan de horario con IA (foto)**
- Vision API de Google o Gemini multimodal
- El usuario sube foto del horario impreso → extrae bloques automáticamente
- Elimina la fricción de ingresar el horario manualmente
- Tiempo estimado: 3-4 días (Gemini ya tiene capacidades multimodales)

**3.4 App nativa (React Native o PWA mejorada)**
- Push notifications reales (actualmente solo email)
- Widget de pantalla de inicio
- Tiempo estimado: 6+ semanas para React Native; 1-2 semanas para mejorar PWA

---

## 7. Auditoría de calidad técnica

### Problemas identificados que deben corregirse ANTES de nuevas funciones

**Performance:**
- `analytics/page.tsx` hace 2 queries pesadas en paralelo. Considerar vistas materializadas en Supabase para los datos de 12 semanas.
- `revalidate = 300` en el dashboard significa datos de hasta 5 minutos. Para el Índice de Riesgo, considerar `revalidate = 0` o ISR con tag-based revalidation.

**UX móvil:**
- El sidebar actual probablemente collapsa bien, pero el calendario semanal/mensual necesita revisión en pantallas < 390px.
- El formulario de tareas nueva debe ser usable con teclado virtual desplegado.

**Seguridad:**
- Verificar que `GEMINI_API_KEY` no esté expuesta en el bundle del cliente (sí está protegida — solo se usa en server actions y API routes, correcto).
- El cron de recordatorios debe verificar `CRON_SECRET` en el header — revisar que esté implementado.

**Accesibilidad:**
- Los colores del semáforo de riesgo (rojo/verde) deben tener texto alternativo para usuarios con daltonismo.
- Asegurar contrast ratio ≥ 4.5:1 en todos los textos sobre fondo oscuro.

**Escalabilidad:**
- Con 50.000 usuarios (límite Supabase free), las queries actuales son correctas con los índices existentes.
- Para el módulo de notas: el índice `idx_grades_subject_id` es esencial y está en el diseño.

---

## 8. Experiencia de usuario — objetivos de flujo

### Meta: 0 → valor en menos de 2 minutos

| Paso | Estado actual | Estado objetivo |
|---|---|---|
| 1. Login Google | ✅ 1 click | ✅ mantener |
| 2. Seleccionar nivel | ❌ no existe | ✅ primer paso del onboarding |
| 3. Sincronizar Gmail | ⚠️ requiere navegar a /emails | ✅ paso 2 del onboarding con resultado visible |
| 4. Ver tareas detectadas | ⚠️ debe ir al dashboard | ✅ mostrar en el mismo onboarding |
| 5. Ver plan de estudio | ⚠️ debe navegar a /planner | ✅ sugerir desde onboarding |
| **Total** | **~5-8 min** | **< 2 min** |

### Navegación sugerida (sidebar)

**Para 7°-8° básico:**
```
Inicio  
Tareas  
Horario  
Calendario  
Logros ← más prominente
```

**Para I°-II° medio:**
```
Inicio  
Tareas  
Notas ← nuevo
Planificador  
Calendario  
Analytics  
```

**Para III°-IV° medio:**
```
Inicio  
Tareas  
Notas  
PAES ← nuevo
Planificador  
Calendario  
Analytics  
```

---

## 9. Métricas de éxito

Para cada fase, medir:

| Métrica | Cómo medir | Target |
|---|---|---|
| Retención D1 | % usuarios que vuelven el día siguiente | > 40% |
| Retención D7 | % usuarios activos a la semana | > 20% |
| Tiempo hasta primer valor | Minutos desde signup hasta ver la primera tarea | < 2 min |
| Adopción del módulo de notas | % usuarios con ≥ 1 nota registrada a los 7 días | > 30% |
| Uso del Pomodoro | % usuarios que usan el timer al menos 1x/semana | > 25% |
| Semáforo consultado | Clicks en el semáforo / usuarios activos | > 50% |
| NPS estudiantil | Encuesta en app después de 2 semanas | > 50 |

---

## 10. Resumen ejecutivo

### Lo que Kstudy hace mejor que cualquier competidor

1. Sync de Gmail con detección de tareas — **nadie más lo tiene**
2. Parseo de temarios con IA — **nadie más lo tiene**
3. Planificador que respeta el horario escolar — **nadie más lo tiene integrado con IA**
4. Gamificación académica real — **solo Kstudy en el mercado escolar**

### Lo que Kstudy debe agregar para retener usuarios

1. **Notas y promedios** — es la función más buscada por estudiantes chilenos de enseñanza media
2. **Pomodoro** — genera hábito de uso diario
3. **Semáforo de riesgo** — diferenciador visible y emocionalmente impactante
4. **Onboarding estructurado** — la retención depende de los primeros 5 minutos

### El posicionamiento correcto

> "Kstudy es la única app académica diseñada específicamente para el estudiante chileno de enseñanza media: organiza el caos, te dice qué estudiar ahora, y te ayuda a llegar a tus metas — desde las pruebas de la semana hasta la PAES."

Ningún competidor puede hacer esa afirmación. MyStudyLife es global y genérico. Google Classroom es de los profesores, no del estudiante. Notion es para adultos. **Kstudy puede ser dueña del segmento K-12 en Chile y LATAM hispanohablante.**

---

*Documento generado en base a auditoría completa del codebase de Kstudy (junio 2026)*
