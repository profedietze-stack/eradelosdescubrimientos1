import { _lsSet, _lsGet } from '../storage/storage.js';
import { gameState } from '../gameState.js';
import { calcularLogros } from './logrosEngine.js';
import { _fmtTiempo, _labelRes } from '../utils.js';
import { mostrarToast } from '../ui/toast.js';

const STATS_KEY = 'colon_stats_v2';

function _statsDefault() {
    return {
        partidas:        0,
        victorias:       0,
        derrotas:        0,
        parciales:       0,
        eventosTotal:    0,
        tiempoJuegoSeg:  0,
        logrosTotal:     [],
        puntajeTotal:    0,
        promedioMoral:   [],
        promedioSumi:    [],
        promedioInteg:   [],
        promedioAuto:    [],
        decisionesTotal: 0,
        crueldades:      0,
        historial:       [],
        rachaVictorias:  0,
        rachaActual:     0,
        mejorPuntaje:    0,
        mejorMoral:      0,
        mejorSuministros:0,
        mejorPuntajePorDif: { estudiante: 0, historiador: 0, almirante: 0 },
    };
}

function cargarStats() {
    try {
        const raw = _lsGet(STATS_KEY);
        if (!raw) return _statsDefault();
        return { ..._statsDefault(), ...JSON.parse(raw) };
    } catch { return _statsDefault(); }
}

function guardarStats(s) {
    const ok = _lsSet(STATS_KEY, JSON.stringify(s));
    if (!ok && !gameState._storageAdvertido) {
        gameState._storageAdvertido = true;
        setTimeout(() => mostrarToast('⚠️ Modo privado: los logros y estadísticas no se guardarán entre sesiones', 'error'), 1500);
    }
}

function calcularPuntajePartida(tipo) {
    const logros  = calcularLogros();
    const ptsLog  = logros.filter(l => l.obtenido).reduce((a,l) => a + (l.pts||0), 0);
    const ptsEv   = gameState.progress * 5;
    const ptsMor  = tipo === 'victoria' ? Math.round(gameState.moral   * 1.2) : 0;
    const ptsSumi = tipo === 'victoria' ? Math.round(gameState.suministros * 0.8) : 0;
    const ptsBase = tipo === 'victoria' ? 500 : tipo === 'parcial' ? 200 : 50;
    const subtotal = ptsBase + ptsLog + ptsEv + ptsMor + ptsSumi;
    const difMult = { estudiante: 0.7, historiador: 1.0, almirante: 1.5 };
    const mult = difMult[gameState.dificultad] ?? 1.0;
    const total = Math.round(subtotal * mult);
    return { total, subtotal, mult, ptsBase, ptsLog, ptsEv, ptsMor, ptsSumi };
}

function registrarPartidaEnStats(tipo, tiempoSeg) {
    const s      = cargarStats();
    const logros = calcularLogros();
    const ptsObj = calcularPuntajePartida(tipo);
    const pts    = ptsObj.total;
    s.partidas++;
    if (tipo === 'victoria') { s.victorias++; s.rachaActual++; }
    else if (tipo === 'parcial') { s.parciales++; s.rachaActual = 0; }
    else { s.derrotas++; s.rachaActual = 0; }
    s.rachaVictorias  = Math.max(s.rachaVictorias, s.rachaActual);
    s.eventosTotal   += gameState.progress;
    s.tiempoJuegoSeg += tiempoSeg || 0;
    s.decisionesTotal += gameState.decisionsHistory.length;
    s.puntajeTotal   += pts;
    s.mejorPuntaje    = Math.max(s.mejorPuntaje, pts);
    s.mejorMoral      = Math.max(s.mejorMoral, gameState.moral);
    s.mejorSuministros= Math.max(s.mejorSuministros, gameState.suministros);
    if (!s.mejorPuntajePorDif) s.mejorPuntajePorDif = { estudiante:0, historiador:0, almirante:0 };
    const dif = gameState.dificultad || 'historiador';
    s.mejorPuntajePorDif[dif] = Math.max(s.mejorPuntajePorDif[dif] || 0, pts);
    s.promedioMoral  = [...(s.promedioMoral||[]),  gameState.moral].slice(-20);
    s.promedioSumi   = [...(s.promedioSumi||[]),   gameState.suministros].slice(-20);
    s.promedioInteg  = [...(s.promedioInteg||[]),  gameState.integridad].slice(-20);
    s.promedioAuto   = [...(s.promedioAuto||[]),   gameState.autoridad].slice(-20);
    logros.filter(l => l.obtenido).forEach(l => {
        if (!s.logrosTotal.includes(l.id)) s.logrosTotal.push(l.id);
    });
    const entrada = {
        fecha:     new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit' }),
        hora:      new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' }),
        nombre:    gameState.playerName || gameState._playerName || '—',
        resultado: tipo,
        eventos:   gameState.progress,
        moral:     gameState.moral,
        suministros: gameState.suministros,
        integridad:  gameState.integridad,
        autoridad:   gameState.autoridad,
        pts,
        ptsDesglose: { base: ptsObj.ptsBase, logros: ptsObj.ptsLog, eventos: ptsObj.ptsEv, moral: ptsObj.ptsMor, sumi: ptsObj.ptsSumi, mult: ptsObj.mult, subtotal: ptsObj.subtotal },
        logros:    logros.filter(l => l.obtenido).length,
        tiempoSeg: tiempoSeg || 0,
        crueldad:  !gameState._nuncaCastigoCruel,
        dificultad: gameState.dificultad || 'historiador',
    };
    s.historial = [entrada, ...(s.historial||[])].slice(0, 20);
    guardarStats(s);
    return { pts, s };
}

function resetearStats() {
    if (!confirm('¿Borrar todo el historial y estadísticas? Esta acción no se puede deshacer.')) return;
    try { _lsSet(STATS_KEY, JSON.stringify(_statsDefault())); } catch {}
}

export { STATS_KEY, _statsDefault, cargarStats, guardarStats, calcularPuntajePartida, registrarPartidaEnStats, resetearStats };
