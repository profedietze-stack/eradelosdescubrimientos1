# AGENTS.md — Proyecto: La Era de los Descubrimientos

## Stack
- Vite 6.4.3 (`base: './'`), ES modules, sin framework UI
- Tests: Vitest (41 tests: gameState 6, utils 15, dataValidation 20)
- Build: `npm run build` → `dist/` con SW generado automáticamente
- Dev: `npm run dev`

## Estructura clave
- `index.html` — Todo el HTML inline (~1032 líneas)
- `js/main.js` — Entry point, funciones expuestas a `window.*`
- `js/events/eventLoader.js` — Núcleo del juego (~405 líneas)
- `js/ui/instrumentos.js` — 4 instrumentos interactivos (brújula, astrolabio, ballestilla, cuadrante) con SVG + pointer events + física de péndulo
- `js/stats/logrosEngine.js` — Logros, bitácora, stats, puntaje
- `js/stats/statsEngine.js` — Stats persistentes, cálculo de puntaje
- `js/ui/modals.js` — Briefing, logros/stats modal, hito histórico
- `js/ui/screenManager.js` — Transiciones de pantalla, fullscreen
- `js/audio/audioManager.js` — Audio sintético (AudioContext, oleaje procedural)
- `js/map/mapInit.js` — Mapa D3, ruta, zoom
- `js/map/shipRenderer.js` — Carabelas SVG en canvas
- `js/storage/saveLoad.js` — Guardar/cargar partida, snapshots
- `js/gameState.js` — Estado global mutable, createInitialState()
- `data/eventosFijos.js` — 17 eventos fijos (3-4 opciones c/u)
- `data/poolEventos.js` — 43 eventos del pool (3-4 opciones c/u)
- `data/rutas.js` — GEO_FIJOS (8 puntos), RUTA_COLON (40 puntos), MAP_COLORS
- `data/colonAdvice.js` — Consejos de Colón por evento
- `data/dificultad.js` — DIFICULTAD_CONFIG (3 niveles)
- `scripts/generate-sw-plugin.js` — Plugin Vite custom: genera sw.js + manifest.webmanifest

## Lo que hicimos (historial)

### 1. Pantalla final comprimida
- Logros como badges inline (vs. tarjetas grandes)
- Bitácora colapsable (últimas 10, toggle "ver todas")
- Perfil de liderazgo en líneas compactas con datos agrupados
- Score panel con padding reducido, desglose filtra valores > 0
- Grid 2 columnas en desktop (`@media min-width: 640px`)
- CSS general más compacto (padding, font-size, gaps reducidos)

### 2. Siete mejoras técnicas
| Mejora | Detalle |
|---|---|
| SW con precache automático | Plugin custom en build escanea `dist/` e inyecta todos los assets hasheados en `sw.js` |
| Mapa offline | Imagen descargada a `img/start-screen-bg.jpg`, src local en index.html |
| Audio en primer toque | `pointerdown` + `click` con `resume()` forzado (Android) |
| Loading spinner | Pantalla de carga con icono animado + spinner CSS, oculto desde `main.js` |
| `loading="lazy"` | Agregado a `<img>` de Colón en modal |
| CSS `contain` | `contain: content/strict` en paneles grandes y mapa |
| Registro SW restaurado | En `main.js` con notificación de nueva versión |

### 3. Análisis de flujo y fixes
| Fix | Archivo |
|---|---|
| Listeners "Consultar a Colón" acumulados | `eventLoader.js` — clonar+reemplazar botón en cada `cargarEvento()` |
| Animationend sin fallback | `eventLoader.js` — timeout 600ms con guarda `pending` |
| Flash de consecuencias antes de muerte | `eventLoader.js` — `finalizarJuegoTemprano()` directo |
| Redundancia `dificultad \|\| dificultad` (12 lugares) | 5 archivos JS — simplificado |
| html2canvas: dead dependency | `package.json` — `npm uninstall` |
| Estado base incompleto | `gameState.js` — declarar `hitoAmericaAplicado`, `azoresAplicado` |

### 4. PWA manifest + iconos SVG
- `img/icon-192.svg` y `img/icon-512.svg` (carabela SVG)
- `public/img/` para que Vite los copie sin hash
- `manifest.webmanifest` generado automáticamente en build
- `<link rel="manifest">`, `<link rel="icon">`, `<link rel="apple-touch-icon">` en `<head>`

### 5. Capture card mejorada
- Marco exterior con fondo degradado y bordes dorados
- Banner de resultado por tipo (victoria/parcial/derrota)
- Perfil de liderazgo con texto completo (no solo `<strong>`)
- Badges de dificultad/eventos/fecha en el footer
- Hint de captura específico por plataforma (iOS/Android/PC)

### 6. Rediseño visual unificado (modo oscuro + gold)
- **Stats bar**: fondo `#1c140f` oscuro con bordes gold, labels en dorado suave, valores gold-light
- **Event container**: fondo `#1a120c` con borde gold 1px + glow sutil (mismo estilo que modales Colón/tripulación)
- **Option buttons**: fondo oscuro con barra gold izquierda que se expande al hover
- **Game screen**: fondo `#0d0805` degradado oscuro (antes parchment claro)
- **Mapa**: borde gold 1px (antes borde marrón 4px)
- **Overlays del mapa** (flota, progreso, zoom): fondo oscuro translúcido, texto gold suave
- **Briefing modal**: unificado con fondo oscuro `#1c140f` + gold borders (antes parchment claro)
- **Selector dificultad**: botones oscuros translúcidos, activo = gradiente gold sólido
- Todos los botones de juego (guardar, continuar, consultar) estilizados con gold translúcido sobre oscuro

### 7. Instrumentos interactivos durante la partida
- Archivo nuevo: `js/ui/instrumentos.js` (446 líneas)
- Fila de 4 botones en el event-container (junto a "Consultar a Colón"): Astrolabio, Brújula, Ballestilla, Cuadrante
- Modal genérico con SVG interactivo para cada instrumento:
  - **Brújula**: aguja siempre apunta al norte; click rápido 3× → sacudida y vuelve; DeviceOrientation en mobile con permiso
  - **Astrolabio**: alidada arrastrable con pointer events, muestra ángulo en vivo
  - **Ballestilla**: travesaño deslizable vertical, muestra altura simulada 5°-85°
  - **Cuadrante**: plomada con física de péndulo amortiguado (requestAnimationFrame), click para soltar
- Botones se ocultan durante consecuencias, reaparecen en cada evento nuevo

## Convenciones
- NO agregar comentarios en el código a menos que sea necesario
- NO crear archivos nuevos a menos que sea necesario
- El nombre del campo es `dificultad` (con tilde)
- NO hacer commits a menos que el usuario lo pida explícitamente
- NO usar emojis en el código
