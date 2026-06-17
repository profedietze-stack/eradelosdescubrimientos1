import { readFileSync, existsSync } from 'fs';

let passed = 0;
let failed = 0;

function check(condition, msg) {
    if (condition) { passed++; } else { failed++; console.error('  FAIL: ' + msg); }
}

function checkFiles() {
    const files = [
        'data/eventosFijos.js', 'data/poolEventos.js', 'data/dificultad.js',
        'data/glosario.js', 'data/rutas.js', 'data/frasesNavegantes.js',
        'data/worldAtlas.js', 'js/gameState.js', 'js/utils.js',
        'js/main.js', 'js/events/eventLoader.js', 'js/map/mapInit.js',
    ];
    console.log('=== Archivos requeridos ===');
    for (const f of files) {
        check(existsSync(f), `${f} existe`);
    }
}

async function checkModules() {
    console.log('\n=== Módulos JS ===');

    const { EVENTOS_FIJOS } = await import('../data/eventosFijos.js');
    const { POOL_EVENTOS } = await import('../data/poolEventos.js');
    const { DIFICULTAD_CONFIG } = await import('../data/dificultad.js');
    const { RUTA_COLON } = await import('../data/rutas.js');
    const { GLOSARIO } = await import('../data/glosario.js');
    const { frasesNavegantes } = await import('../data/frasesNavegantes.js');
    const { createInitialState } = await import('../js/gameState.js');

    const fijos = Object.values(EVENTOS_FIJOS);
    const entries = Object.entries(EVENTOS_FIJOS);

    check(fijos.length === 17, `Eventos fijos: ${fijos.length} (debe ser 17)`);
    check(POOL_EVENTOS.length >= 20, `Pool eventos: ${POOL_EVENTOS.length} (debe ser >= 20)`);

    for (const [key, ev] of entries) {
        const pos = Number(key);
        check(Number.isInteger(pos) && pos >= 0 && pos < 40,
            `Evento ${ev.id} posición ${key} inválida`);
        check(ev.opciones && ev.opciones.length >= 1, `Evento ${ev.id} sin opciones`);
    }

    for (const ev of fijos) {
        for (const op of ev.opciones) {
            check(op.efectos && typeof op.efectos.moral === 'number',
                `${ev.id} opción sin efectos.moral`);
        }
    }

    for (const ev of [...fijos, ...POOL_EVENTOS]) {
        check(!ev.texto.includes('\uFFFD'), `${ev.id} texto tiene carácter de reemplazo`);
        for (const op of ev.opciones) {
            check(!op.texto.includes('\uFFFD'), `${ev.id} opción tiene carácter de reemplazo`);
        }
    }

    const state = createInitialState('estudiante');
    check(state.moral > 0, `Estado inicial moral = ${state.moral} > 0`);
    check(state.progress === 0, `Estado inicial progress = ${state.progress}`);

    check(RUTA_COLON.length === 21, `RUTA_COLON = ${RUTA_COLON.length} puntos`);
    for (const wp of RUTA_COLON) {
        check(Array.isArray(wp) && wp.length === 2, `Waypoint inválido: ${JSON.stringify(wp)}`);
    }

    check(Object.keys(DIFICULTAD_CONFIG).length === 3,
        `Dificultades: ${Object.keys(DIFICULTAD_CONFIG).length}`);

    check(frasesNavegantes.length >= 10, `Frases: ${frasesNavegantes.length}`);
    for (const f of frasesNavegantes) {
        check(!f.includes('\uFFFD'), 'Frase con carácter de reemplazo');
    }

    const glosEntries = Object.keys(GLOSARIO);
    check(glosEntries.length >= 5, `Glosario: ${glosEntries.length} entradas`);
    for (const [term, def] of Object.entries(GLOSARIO)) {
        check(!def.includes('\uFFFD'), `Glosario "${term}" con carácter de reemplazo`);
    }
}

async function main() {
    console.log('=== Validación de datos: Era de los Descubrimientos ===\n');
    checkFiles();
    try {
        await checkModules();
    } catch (e) {
        failed++;
        console.error('  Error:', e.message);
    }
    console.log(`\n=== ${passed} pasaron, ${failed} fallaron ===`);
    process.exit(failed > 0 ? 1 : 0);
}

main();
