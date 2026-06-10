# De Vibe Coding a Spec-Driven Development: La Nueva Era del Desarrollo con IA

> Un artículo que explora cómo Spec-Driven Development (SDD) está reemplazando al "vibe coding" como metodología profesional para construir software con asistencia de IA. Incluye una guía práctica de GitHub Spec Kit.

---

## Tabla de Contenidos

1. [El Fin del Vibe Coding](#el-fin-del-vibe-coding)
2. [Qué es Spec-Driven Development](#qué-es-spec-driven-development)
3. [Los Tres Niveles de SDD](#los-tres-niveles-de-sdd)
4. [Los Seis Elementos de un Buen Spec](#los-seis-elementos-de-un-buen-spec)
5. [SDD vs TDD vs BDD vs Vibe Coding](#sdd-vs-tdd-vs-bdd-vs-vibe-coding)
6. [Panorama de Herramientas](#panorama-de-herramientas)
7. [Guía Práctica: GitHub Spec Kit](#guía-práctica-github-spec-kit)
8. [Ejemplo Real: Escribiendo un Spec Efectivo](#ejemplo-real-escribiendo-un-spec-efectivo)
9. [Cuándo Usar SDD (y Cuándo No)](#cuándo-usar-sdd-y-cuándo-no)
10. [Lecciones Aprendidas](#lecciones-aprendidas)
11. [Referencias](#referencias)

---

## El Fin del Vibe Coding

Andrej Karpathy acuñó el término "vibe coding" en febrero de 2025: le das un prompt corto a un LLM, esperas el código, lo revisas, iteras. Funciona para proyectos simples. **No escala para proyectos serios.**

Un año después, el propio Karpathy admitió que esa era está terminando:

> *"Programming via LLM agents is increasingly becoming a default workflow for professionals, except with more oversight and scrutiny. Many people have tried to come up with a better name... personally my current favorite 'agentic engineering': 'agentic' because you are not writing the code directly 99% of the time, you are orchestrating agents who do and acting as oversight. 'engineering' to emphasize that there is an art & science and expertise to it."*
>
> — Andrej Karpathy, 2026

### Los Problemas del Vibe Coding

| Problema | Descripción |
|----------|-------------|
| **Context drift** | Un fix en un área rompe otra, porque nadie entendió el sistema completo |
| **Fragmentación** | Cada agente genera código con convenciones diferentes |
| **Deuda técnica acelerada** | Las shortcuts se acumulan sin que nadie las documente |
| **Decisiones perdidas** | Nadie recuerda POR QUÉ se tomó una decisión arquitectónica |
| **Falsa productividad** | Código que funciona hoy pero explota mañana en producción |

Los datos lo confirman: un estudio de arXiv (2026) contabilizó **más de 110,000 issues sobrevivientes** introducidos por IA en repositorios de producción. Un análisis de SonarQube sobre cinco LLMs encontró que **más del 70% de las vulnerabilidades** detectadas en código generado por Llama 3.2 90B eran de severidad BLOCKER.

El problema central: los tests unitarios verifican funciones individuales. **No detectan violaciones arquitectónicas, drift en contratos de API, o anti-patrones de seguridad** que emergen entre servicios.

---

## Qué es Spec-Driven Development

Spec-Driven Development (SDD) es una metodología donde **las especificaciones se escriben ANTES del código** y se mantienen como fuente de verdad a lo largo de todo el ciclo de vida del software.

No es solo "escribir requirements antes de codear". Es un **cambio fundamental de paradigma**:

| Enfoque Tradicional | Spec-Driven Development |
|---------------------|------------------------|
| El código es el rey | La especificación es el rey |
| Los docs son scaffolding descartable | Los specs son artefactos vivos |
| La IA recibe prompts vagos | La IA recibe contratos ejecutables |
| La verdad está en el código | La verdad está en la especificación |

Como lo define IBM: *"SDD is a software methodology in which a detailed specification is authored and agreed upon before development begins. It serves as a single source of truth for what to build and how to build it."*

Como lo define GitHub: *"In this new world, maintaining software means evolving specifications. The lingua franca of development moves to a higher level, and code is the last-mile approach."*

---

## Los Tres Niveles de SDD

No todos los proyectos necesitan el mismo nivel de rigor. Birgitta Böckeler (Thoughtworks) identificó tres niveles en su análisis para Martin Fowler:

### Nivel 1: Spec-First

La spec se escribe primero y guía la generación de código. Una vez completada la tarea, la spec puede quedarse obsoleta.

```
Spec → Código → (la spec ya no se mantiene)
```

- **Para quién**: Equipos que están empezando con SDD
- **Cuándo**: Proyectos nuevos, features bien definidas
- **Riesgo**: La spec se desactualiza y pierde valor

### Nivel 2: Spec-Anchored

La spec se mantiene viva y evoluciona junto con el software. Tests automatizados sirven como puente entre documentación e implementación.

```
Spec → Código → Spec actualizada → Código actualizado → ...
```

- **Para quién**: Equipos enterprise que necesitan audit trails
- **Cuándo**: Proyectos con requisitos regulatorios, múltiples equipos
- **Ventaja**: La spec siempre refleja el estado actual del sistema

### Nivel 3: Spec-as-Source

La spec ES el código fuente. Los humanos solo editan specs. El código se genera automáticamente y se marca con `// GENERATED FROM SPEC - DO NOT EDIT`.

```
Spec ⇄ Código (bidireccional, automático)
```

- **Para quién**: Dominios API-first con tooling maduro
- **Cuándo**: Alta confianza en el pipeline de generación
- **Riesgo**: Hereda los problemas del Model-Driven Development + la no-determinismo de LLMs

### ¿Cuál elegir?

```
¿Tu proyecto es nuevo?           → Spec-First
¿Necesitas auditabilidad?        → Spec-Anchored
¿Es un dominio API-first maduro? → Spec-as-Source
¿No estás seguro?                → Empieza con Spec-First, migra cuando tengas confianza
```

---

## Los Seis Elementos de un Buen Spec

Augment Code identifica seis preguntas que todo spec debe responder. Si dejas alguna abierta, el agente de IA la responderá por ti — y no te va a gustar cómo.

### 1. Outcomes (Resultados)

NO: "Build an auth flow"

SÍ: "A user can sign up with email/password, receive a verification email, and log in without error. The session persists across page refreshes."

Los outcomes fuerzan claridad que los nombres de features no proporcionan.

### 2. Scope Boundaries (Límites)

La lista de **out-of-scope** importa TANTO como la de in-scope. Los agentes expanden scope si no les cierras la puerta.

```
IN SCOPE:
- Email/password authentication
- Session persistence

OUT OF SCOPE:
- OAuth / Social login
- Two-factor authentication
- Password reset flow
```

### 3. Constraints and Assumptions

Stack tecnológico, límites de APIs de terceros, requisitos de performance. Si afecta decisiones de implementación y no es obvio desde el codebase, va en el spec.

### 4. Decisions Already Made

Si ya elegiste la base de datos o la librería de encriptación, dilo. Los agentes que no saben que una decisión ya fue tomada... toman la suya propia.

### 5. Task Breakdown

Uno de los mayores modos de fallo de IA es pedir demasiado de una vez. Un breakdown en subtareas discretas permite que agentes individuales trabajen en cada una, verifiquen sobre la marcha, y operen en paralelo.

### 6. Verification Criteria

No "does it work" sino: qué tests pasan, qué edge cases están cubiertos, qué comportamiento se espera en casos límite.

---

## SDD vs TDD vs BDD vs Vibe Coding

| Dimensión | TDD | BDD | Vibe Coding | SDD |
|-----------|-----|-----|-------------|-----|
| **Artefacto primario** | Unit tests | Escenarios Given-When-Then | Prompts en lenguaje natural | Especificaciones ejecutables |
| **Alcance** | Correctitud de funciones | Comportamiento cross-funcional | Generación de aplicación completa | Contratos arquitectónicos de sistema |
| **Validación** | Suites de tests automatizadas | Documentación humana | Review manual (si hay) | Build falla si el spec diverge |
| **Gobernanza de IA** | Ninguna | Ninguna | Ninguna | Constraints constitucionales + checkpoints |
| **Dónde vive la verdad** | Test suite | Artefactos de workshop | Historial de prompts | Especificación versionada |

**SDD no reemplaza TDD ni BDD — se complementa.** TDD para correctitud de implementación, SDD para constraints arquitectónicos.

---

## Panorama de Herramientas

### Kiro (Amazon)

- **Workflow**: Requirements → Design → Tasks (3 archivos Markdown)
- **Nivel SDD**: Spec-First
- **Integración**: VS Code distribution propia
- **Memory Bank**: "Steering" — `product.md`, `tech.md`, `structure.md`
- **Pros**: Simple, intuitivo, 3 pasos claros
- **Contras**: Verbose para bugs pequeños, no spec-anchored

### Spec Kit (GitHub)

- **Workflow**: Constitution → Specify → Plan → Tasks → Implement
- **Nivel SDD**: Spec-First (aspira a Spec-Anchored)
- **Integración**: 30+ agentes (Claude Code, Copilot, Cursor, Gemini, Codex, etc.)
- **Distribución**: Python CLI + slash commands
- **Pros**: Open source (111k stars), extremadamente personalizable, extensions y presets
- **Contras**: Genera MUCHOS archivos markdown, puede ser overkill para features chicas

### Tessl Framework

- **Workflow**: Spec ⇄ Code (bidireccional)
- **Nivel SDD**: Spec-as-Source
- **Estado**: Private beta
- **Característica única**: Los specs se sincronizan bidireccionalmente con el código
- **Pros**: El más ambicioso, specs como fuente literal
- **Contras**: Aún en beta, hereda problemas de MDD + no-determinismo de LLMs

### Comparación Rápida

| Herramienta | Nivel SDD | Archivos por Spec | Curva de Aprendizaje | Mejor Para |
|-------------|-----------|-------------------|---------------------|------------|
| Kiro | Spec-First | 3 | Baja | Features medianas, equipos nuevos |
| Spec Kit | Spec-First/Anchored | 5-8 | Media | Proyectos serios, equipos con processes |
| Tessl | Spec-as-Source | 1-2 por archivo | Alta | Dominios API-first, máxima automatización |

---

## Guía Práctica: GitHub Spec Kit

Spec Kit es la herramienta más popular y accesible. Aquí va una guía completa de instalación y uso.

### Instalación

**Prerequisitos**:
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (recomendado) o pipx
- Git
- Un agente de IA soportado (Claude Code, Copilot, Cursor, etc.)

```bash
# Instalar el CLI
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Verificar instalación
specify version
```

### Inicializar un Proyecto

```bash
# Crear proyecto nuevo
specify init mi-proyecto --integration copilot
cd mi-proyecto

# O inicializar en directorio existente
specify init . --integration claude

# Forzar en directorio con archivos
specify init . --force --integration copilot

# Listar integraciones disponibles
specify integration list
```

**Integraciones soportadas** (30+): Claude Code, GitHub Copilot, Cursor, Gemini CLI, Codex CLI, opencode, Kiro, Qwen, Tabnine, Amp, Augment, Cline, Continue, Goose, Warp, y muchos más.

### Estructura Generada

Después de `specify init`, tendrás:

```
mi-proyecto/
├── .specify/
│   ├── memory/
│   │   └── constitution.md      # Principios del proyecto
│   ├── scripts/
│   │   └── bash/
│   │       ├── check-prerequisites.sh
│   │       ├── create-new-feature.sh
│   │       ├── setup-plan.sh
│   │       └── setup-tasks.sh
│   └── templates/
│       ├── plan-template.md
│       ├── spec-template.md
│       └── tasks-template.md
├── specs/                         # Especificaciones de features
└── (tu código)
```

### El Workflow Completo

#### Paso 1: Constitution (Principios del Proyecto)

```bash
# En tu agente de IA (ejemplo con Claude Code)
/speckit.constitution Create principles focused on code quality, testing
standards, user experience consistency, and performance requirements.
```

Esto crea `.specify/memory/constitution.md` — los principios inmutables que guían TODO el desarrollo.

#### Paso 2: Specify (Definir el Qué)

```bash
/speckit.specify Build a task management application. Users can create
projects, add team members, assign tasks, comment and move tasks between
boards in Kanban style. There will be predefined users (1 PM, 4 engineers)
and 3 sample projects. Standard Kanban columns: To Do, In Progress,
In Review, Done. Tasks assigned to the current user appear highlighted.
```

Esto crea:
- Un branch nuevo (ej: `001-create-taskify`)
- Un directorio `specs/001-create-taskify/`
- Un archivo `spec.md` con user stories y requirements

#### Paso 3: Clarify (Opcional pero Recomendado)

```bash
/speckit.clarify
```

Ejecuta un workflow estructurado de preguntas y respuestas para refinar la spec ANTES de planificar. Registra las respuestas en una sección "Clarifications".

#### Paso 4: Plan (Definir el Cómo)

```bash
/speckit.plan Use React with TypeScript for the frontend, Node.js with
Express for the backend, PostgreSQL as database. Use drag-and-drop
library for Kanban boards.
```

Esto genera:
- `specs/001-create-taskify/plan.md` — plan de implementación
- `specs/001-create-taskify/research.md` — investigación técnica
- `specs/001-create-taskify/data-model.md` — modelo de datos
- `specs/001-create-taskify/quickstart.md` — cómo empezar
- `specs/001-create-taskify/contracts/` — specs de API

#### Paso 5: Tasks (Desglosar en Tareas)

```bash
/speckit.tasks
```

Genera `tasks.md` con:
- Desglose por user story
- Gestión de dependencias
- Marcadores de ejecución paralela `[P]`
- Paths de archivos para cada tarea
- Estructura TDD (tests antes de implementación)
- Checkpoints de validación

#### Paso 6: Analyze (Opcional)

```bash
/speckit.analyze
```

Análisis cross-artifact de consistencia y cobertura. Ejecutar después de `/speckit.tasks` y antes de `/speckit.implement`.

#### Paso 7: Implement (Ejecutar)

```bash
/speckit.implement
```

Ejecuta todas las tareas en orden, respetando dependencias y marcadores paralelos. Sigue el enfoque TDD definido en el plan de tareas.

### Comandos Adicionales

| Comando | Descripción |
|---------|-------------|
| `/speckit.checklist` | Genera checklists de calidad que validan completitud de requirements |
| `/speckit.taskstoissues` | Convierte tasks en GitHub Issues |
| `/speckit.clarify` | Clarificación estructurada antes de planificar |

### Personalización: Extensions y Presets

**Extensions** agregan capacidades nuevas:

```bash
specify extension search          # Buscar extensions disponibles
specify extension add <nombre>    # Instalar una extensión
```

**Presets** personalizan workflows existentes:

```bash
specify preset search             # Buscar presets disponibles
specify preset add <nombre>       # Instalar un preset
```

Prioridad de resolución:
1. Project-Local Overrides (`.specify/templates/overrides/`)
2. Presets instalados (`.specify/presets/templates/`)
3. Extensions instaladas (`.specify/extensions/templates/`)
4. Spec Kit Core (`.specify/templates/`)

### Upgrade

```bash
specify self check                 # Verificar si hay updates
specify self upgrade --dry-run     # Preview sin ejecutar
specify self upgrade               # Upgrade a latest stable
specify self upgrade --tag v0.10.1 # Pin a versión específica
```

---

## Ejemplo Real: Escribiendo un Spec Efectivo

Aquí hay un ejemplo concreto de un spec bien escrito para un feature de autenticación:

```markdown
You are implementing a user login feature for a web application.
Use the following specification as your single source of truth.
Do not make assumptions about any requirement not listed here.

FEATURE: User Login

OVERVIEW:
Allow registered users to authenticate securely using their email
address and password.

ACCEPTANCE CRITERIA:
1. The login form must accept an email address and password
2. If credentials are valid, redirect the user to the dashboard
3. If credentials are invalid, display a generic error message
   without specifying which field is incorrect
4. Lock the account for 15 minutes after 5 consecutive failed
   login attempts
5. Transmit passwords over HTTPS only — never store in plain text

OUT OF SCOPE:
- Social login (OAuth)
- Two-factor authentication
- Password reset flow

EDGE CASES:
- Catch empty fields client-side before submission
- Redirect expired sessions to the login page with a message
- The form must remain functional if JavaScript is disabled

CONSTRAINTS:
- Max 3 redirects per session
- Session cookie: httpOnly, secure, sameSite=strict
- Password hashing: bcrypt with cost factor 12

Do not begin implementation until you have confirmed your
understanding of the acceptance criteria.
```

### Por qué este spec es bueno

| Elemento | Cumple |
|----------|--------|
| Outcomes claros | "Redirect to dashboard" no "build auth" |
| Scope explícito | OAuth, 2FA, reset — todo out of scope |
| Edge cases | Campos vacíos, sesiones expiradas, sin JS |
| Constraints técnicos | bcrypt, cookie flags, límite de redirects |
| Verification | Cada criterio es testeable |
| Anti-suposiciones | "Do not make assumptions" |

---

## Cuándo Usar SDD (y Cuándo No)

### Usa SDD Cuando...

- El trabajo abarca múltiples sesiones de agente
- Múltiples servicios o repos están involucrados
- Revertir una interpretación incorrecta es costoso
- Necesitas compliance o audit trail
- El review requiere atención real (lógica de componentes, flujos E2E)

### NO Uses SDD Cuando...

- Es una fix chiquita que se resuelve con un prompt
- El trabajo es exploratorio o experimental
- El output se puede revisar en menos de 5 minutos
- Es un prototipo descartable
- El cambio es mecánico o de bajo riesgo

**La regla práctica**: Si te molestaría que el agente interprete los requirements diferente a lo que querías, escribe un spec. Si podés corregir el output con un follow-up prompt rápido, saltate el spec.

---

## Lecciones Aprendidas

### 1. La Spec es Más Valiosa que el Código

En la era de IA, el código es commodity. Lo que diferencia un buen proyecto de un desastre es la CALIDAD de las especificaciones. Un error en la spec se propaga a todo lo downstream.

### 2. Review de Markdown > Review de Código

Birgitta Böckeler (Thoughtworks) lo planteó bien: "I'd rather review code than all these markdown files." Las herramientas de SDD pueden generar VERBOSIDAD excesiva. El desafío no es escribir specs — es escribir specs que valgan la pena leer.

### 3. Iterativo > Big-Bang

Las mejores implementaciones de SDD son iterativas: spec pequeño → implementación → validación → spec actualizado. NO spec gigante → implementación gigante → dolor de cabeza.

### 4. El Rol del Desarrollador Cambió

De escribir código directamente a:
- **Pensar** arquitectura y decisions
- **Escribir** especificaciones precisas
- **Verificar** que la implementación cumple
- **Coordinar** agentes que ejecutan

El inglés se está convirtiendo en el "lenguaje de programación" principal. No es exageración.

### 5. Cuidado con la Trampa de Over-Engineering

Si pasás tres semanas debatiendo el nombre de un key JSON para un feature que puede desaparecer en un mes, estás haciendo SDD mal. Specs livianas y evolutivas > specs exhaustivas y "finales".

### 6. Spec Kit No Es la Única Opción

Spec Kit es excelente para empezar, pero no es bala de plata. Muchos equipos usan approaches híbridos: AGENTS.md como memory bank + specs ad-hoc por feature. Lo importante es el PRINCIPIO (spec-first), no la herramienta.

---

## Referencias

1. **Towards Data Science** — [From Vibe Coding to Spec-Driven Development](https://towardsdatascience.com/from-vibe-coding-to-spec-driven-development/) — Mariya Mansurova, May 2026
2. **Martin Fowler / Thoughtworks** — [Understanding Spec-Driven Development: Kiro, spec-kit, and Tessl](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) — Birgitta Böckeler, Oct 2025
3. **Augment Code** — [What Is Spec-Driven Development? A Complete Guide](https://www.augmentcode.com/guides/what-is-spec-driven-development) — Molisha Shah, Apr 2026
4. **IBM** — [What is Spec-Driven Development?](https://www.ibm.com/think/topics/spec-driven-development) — Anna Gutowska, May 2026
5. **GitHub** — [Spec Kit](https://github.com/github/spec-kit) — Open Source Toolkit (111k stars, 161 releases)
6. **arXiv** — "Spec-Driven Development: From Code to Contract in the Age of AI" (Feb 2026)
7. **DeepLearning.AI** — "Spec-Driven Development with Coding Agents" (JetBrains course)
8. **Andrej Karpathy** — [X Post on Agentic Engineering](https://x.com/karpathy/status/2019137879310836075) (2026)

---

*Artículo escrito como parte del proyecto Arduino Virtual Simulator — un ejemplo real de Spec-Driven Development en acción.*
