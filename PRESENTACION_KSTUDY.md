# Kstudy AI — Plataforma Académica Inteligente

## ¿Qué es Kstudy AI?

Kstudy AI es una plataforma web diseñada para estudiantes que quieren organizarse mejor, rendir más y estresarse menos. Combina gestión académica, inteligencia artificial y análisis de hábitos en una sola aplicación, con una interfaz moderna y fácil de usar.

Está construida para el estudiante real: el que recibe información de sus profesores por correo, el que tiene pruebas acumuladas, el que no sabe por dónde empezar a estudiar. Kstudy AI ordena ese caos y convierte la carga académica en un plan de acción claro.

---

## Funcionalidades principales

### 1. Gestión de tareas inteligente
Centraliza todas las evaluaciones, tareas y exposiciones en un solo lugar. El sistema clasifica automáticamente cada tarea por tipo (evaluación, tarea, exposición, proyecto), prioridad (urgente, alta, media, baja) y fecha de entrega. Las tareas urgentes o próximas a vencer se destacan automáticamente en una sección de "atención inmediata", para que el estudiante nunca pierda una entrega importante.

### 2. Sincronización con Gmail
Kstudy AI se conecta con la cuenta de Gmail del estudiante y detecta automáticamente correos de profesores con fechas de evaluaciones, entregas y actividades. Extrae la información relevante y la convierte en tareas concretas, eliminando la necesidad de ingresar datos manualmente.

### 3. Parseo de temarios con IA (Gemini)
El estudiante puede pegar el texto de su programa o temario directamente en la app. La inteligencia artificial (Google Gemini 2.0) analiza el contenido y extrae automáticamente todas las evaluaciones, fechas, porcentajes y tareas, creándolas en el sistema con un solo clic.

### 4. Planificador de estudio con IA
A partir de las tareas pendientes y sus fechas de entrega, la IA genera un plan de estudio personalizado que distribuye sesiones de estudio a lo largo de los días disponibles. El plan considera la prioridad de cada evaluación y el tiempo disponible del estudiante, maximizando la preparación antes de cada prueba.

### 5. Horario escolar personalizable
El estudiante puede registrar su horario de clases completo, con bloques por día, hora de inicio y hora de término. Soporta materias que se repiten en distintos días con horarios diferentes, recreos, y asignación de colores por asignatura para identificación visual rápida.

### 6. Calendario integrado
Vista mensual, semanal y diaria que integra en un solo lugar: tareas con sus fechas de entrega, bloques del horario de clases y rutinas personales. Los colores de las materias son consistentes en todas las vistas, y el sistema detecta correctamente el día actual independiente de la zona horaria del servidor.

### 7. Widget "¿Qué estudiar ahora?"
En el dashboard principal aparece una recomendación en tiempo real de qué hacer en este momento: si hay una sesión de estudio activa la muestra, si hay una próxima la anticipa, y si no hay sesiones sugiere la tarea más urgente pendiente. Elimina la parálisis por análisis y da un punto de partida claro.

### 8. Progreso semanal
Un resumen visible en el dashboard con las tareas completadas en la semana, las horas de estudio acumuladas y el porcentaje de entregas de la semana resueltas, con una barra de progreso visual.

### 9. Analytics académico
Panel completo de análisis con gráficos de tareas completadas por semana (últimas 12 semanas), distribución de carga por asignatura, horas de estudio acumuladas, y una grilla de actividad estilo GitHub para visualizar la constancia de estudio.

### 10. Racha de estudio
Sistema de racha diaria que registra los días consecutivos con sesiones de estudio completadas. Motiva al estudiante a mantener hábitos consistentes con métricas visibles de racha actual y racha más larga histórica.

### 11. Logros y sistema de XP
12 logros desbloqueables basados en el progreso real del estudiante: primera tarea completada, racha de 7 días, 10 horas de estudio, tareas urgentes resueltas, entre otros. Cada logro otorga XP y el sistema muestra el porcentaje de progreso general, gamificando la experiencia académica sin distracciones.

### 12. Insights de hábitos de estudio
Análisis automático de los patrones de estudio del estudiante: día más productivo de la semana, tasa de completitud de tareas, porcentaje de entregas realizadas antes de la fecha límite y asignatura con mayor carga académica. Todo calculado a partir de los datos reales del estudiante, sin necesidad de IA adicional.

---

## ¿Por qué Kstudy AI?

| Problema actual | Solución Kstudy AI |
|---|---|
| Información académica dispersa en correos, WhatsApp y papel | Todo centralizado en un solo lugar |
| No saber qué estudiar ni por dónde empezar | IA que genera un plan personalizado |
| Olvidar fechas de entrega | Sistema de alertas y priorización automática |
| No tener visibilidad del progreso propio | Analytics y logros en tiempo real |
| Ingresar datos manualmente es tedioso | Sincronización Gmail + parseo IA de temarios |

---

## Tecnología

Kstudy AI está construida sobre tecnología moderna, escalable y segura:

- **Frontend**: Next.js 15 (React), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + autenticación + Row Level Security)
- **Inteligencia Artificial**: Google Gemini 2.0 Flash
- **Infraestructura**: Vercel (deploy global con CDN)
- **Integraciones**: Gmail API, Google OAuth
- **PWA**: Instalable como app en dispositivos móviles

Cada usuario tiene sus datos completamente aislados y protegidos mediante políticas de seguridad a nivel de base de datos.

---

## Estado actual

La aplicación está **en producción y funcionando**. Ha sido desarrollada y validada por una estudiante universitaria activa, lo que garantiza que las funcionalidades responden a necesidades reales del mundo académico.

**Disponible en**: [kstudy-ai.vercel.app](https://kstudy-ai.vercel.app)

---

## Oportunidad de mercado

En Chile hay más de 1.200.000 estudiantes en educación superior. A nivel latinoamericano, más de 25 millones. La adopción de herramientas digitales de productividad académica crece año a año, y no existe hoy una solución local que combine organización, IA y análisis de hábitos en una plataforma accesible para el estudiante promedio.

Kstudy AI está posicionada para ser esa solución.

---

*Desarrollada con Next.js, Supabase y Google Gemini · 2026*
