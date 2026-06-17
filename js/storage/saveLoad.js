import { _lsGet, _lsSet, _checkStorage } from './storage.js';
import { gameState } from '../gameState.js';
import { generarSecuenciaEventos, cargarEvento, secuenciaActual } from '../events/eventLoader.js';
import { _iniciarJuegoConFS, _fsSupported } from '../ui/screenManager.js';
import { actualizarNombreJugador } from '../ui/statsUI.js';
import { mostrarToast } from '../ui/toast.js';
import { calcularLogros } from '../stats/logrosEngine.js';
import { calcularPuntajePartida } from '../stats/statsEngine.js';
import { EVENTOS_FIJOS } from '../../data/eventosFijos.js';
import { POOL_EVENTOS } from '../../data/poolEventos.js';

const SNAPSHOTS_KEY = 'colon_snapshots_v1';
const MAX_SNAPSHOTS = 5;

function guardarPartida() {
    const secIds = secuenciaActual.map(ev => ev.id);
    const saveData = { gameState, nuncaCastigoCruel: gameState._nuncaCastigoCruel, moralMinima: gameState._moralMinima, secIds, dificultad: gameState.dificultad };
    const ok = _lsSet('columbusSave', JSON.stringify(saveData));
    mostrarToast(ok ? 'Partida guardada correctamente' : 'No se pudo guardar (modo privado)', ok ? 'ok' : 'error');
}

function cargarPartida() {
    if (typeof _fsSupported !== 'undefined' && _fsSupported) {
        const yaEnFS = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                          document.mozFullScreenElement || document.msFullscreenElement);
        if (!yaEnFS) {
            const el = document.documentElement;
            const req = el.requestFullscreen || el.webkitRequestFullscreen ||
                        el.mozRequestFullScreen || el.msRequestFullscreen;
            if (req) req.call(el).catch(() => {});
        }
    }
    const save = _lsGet('columbusSave');
    if (!save) { mostrarToast('No hay partida guardada', 'error'); return; }
    let saveData;
    try { saveData = JSON.parse(save); } catch(e) { mostrarToast('Guardado corrupto', 'error'); return; }
    if (saveData.gameState) {
        Object.assign(gameState, saveData.gameState);
        gameState._nuncaCastigoCruel = saveData.nuncaCastigoCruel ?? true;
        gameState._moralMinima       = saveData.moralMinima ?? saveData.gameState.moral;
    } else {
        Object.assign(gameState, saveData);
        gameState._nuncaCastigoCruel = true;
        gameState._moralMinima = 80;
    }
    gameState._hitoYaMostrado = !!(gameState.hitoAmericaAplicado);
    if (!('hitoAmericaAplicado' in gameState)) gameState.hitoAmericaAplicado = false;
    if (!('azoresAplicado' in gameState)) gameState.azoresAplicado = false;
    gameState._playerName = gameState.playerName || 'Primer Oficial';
    gameState.dificultad = saveData.dificultad || gameState.dificultad || 'historiador';

    if (saveData.secIds && saveData.secIds.length === 40) {
        const allById = {};
        Object.values(EVENTOS_FIJOS).forEach(ev => { allById[ev.id] = ev; });
        POOL_EVENTOS.forEach(ev => { allById[ev.id] = ev; });
        const restored = saveData.secIds.map((id, pos) => {
            const ev = allById[id];
            return ev ? { ...ev, posicion: pos } : null;
        }).filter(Boolean);
        secuenciaActual.length = 0;
        secuenciaActual.push(...(restored.length === 40 ? restored : generarSecuenciaEventos()));
    } else {
        secuenciaActual.length = 0;
        secuenciaActual.push(...generarSecuenciaEventos());
    }

    actualizarNombreJugador();
    gameState._pendingContinuar = null;
    _iniciarJuegoConFS(() => cargarEvento(gameState.currentEventIndex));
}

function guardarSnapshot(tipo) {
    if (!_checkStorage()) return;
    const logros = calcularLogros().filter(l => l.obtenido);
    const perfil = _detectarPerfil();
    const ptsObj = calcularPuntajePartida(tipo);
    const snap = {
        id:          Date.now(),
        fecha:       new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit' }),
        hora:        new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' }),
        nombre:      gameState.playerName || gameState._playerName || 'Primer Oficial',
        tipo,
        dificultad:  gameState.dificultad || 'historiador',
        moral:       gameState.moral,
        suministros: gameState.suministros,
        integridad:  gameState.integridad,
        autoridad:   gameState.autoridad,
        eventos:     gameState.progress,
        logros:      logros.map(l => ({ icon: l.icon, nombre: l.nombre })),
        perfil,
        pts:         ptsObj.total,
        titulo:      document.getElementById('ending-title')?.textContent || '',
        subtitulo:   document.getElementById('ending-subtitle')?.textContent || '',
    };
    try {
        const raw  = _lsGet(SNAPSHOTS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(snap);
        _lsSet(SNAPSHOTS_KEY, JSON.stringify(list.slice(0, MAX_SNAPSHOTS)));
    } catch {}
}

function _detectarPerfil() {
    const el = document.getElementById('perfil-liderazgo');
    if (!el) return '';
    // Extraer todo el texto relevante del perfil (líneas separadas por ·)
    const lines = [];
    el.querySelectorAll('p').forEach(p => {
        const text = p.textContent.trim();
        if (text) lines.push(text);
    });
    return lines.length > 0 ? lines.join(' · ') : el.textContent.trim().slice(0, 120);
}

function cargarSnapshots() {
    try {
        const raw = _lsGet(SNAPSHOTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function _buildCaptureCard(snap) {
    const emojiTipo = { victoria:'\u2693', parcial:'\uD83C\uDF0A', derrota:'\uD83D\uDC80' };
    const labelTipo = { victoria:'Victoria', parcial:'Resultado parcial', derrota:'Derrota' };
    const logrosHTML = snap.logros.length
        ? snap.logros.map(l => `<span class="cap-logro-pill">${l.icon} ${l.nombre}</span>`).join('')
        : '<span style="color:rgba(255,255,255,0.4);font-size:0.72rem;font-style:italic;">Ninguno</span>';
    const difLabel = { estudiante:'\uD83C\uDF93 Estudiante', historiador:'\uD83D\uDCDC Historiador', almirante:'\u2693 Almirante' };
    const difCls = snap.dificultad || 'historiador';

    return `
    <div class="cap-frame">
    <div class="cap-banner ${snap.tipo}">
        <span class="cap-banner-emoji">${emojiTipo[snap.tipo] || '\uD83C\uDF0A'}</span>
        <span class="cap-banner-title">${snap.titulo || labelTipo[snap.tipo]}</span>
        ${snap.subtitulo ? `<span class="cap-banner-sub">${snap.subtitulo}</span>` : ''}
        <span class="cap-nombre">${snap.nombre}
            <span class="cap-dif-badge ${difCls}">${difLabel[difCls] || difCls}</span>
        </span>
    </div>

    <div class="cap-body">
    <div class="cap-section">
        <div class="cap-section-title">\u2694\uFE0F Estado final de la expedici\u00F3n</div>
        <div class="cap-stats-row">
            <div class="cap-stat-cell"><span class="cap-stat-icon">\u2694\uFE0F</span><span class="cap-stat-val">${snap.moral}</span><span class="cap-stat-lbl">Moral</span></div>
            <div class="cap-stat-cell"><span class="cap-stat-icon">\uD83C\uDF56</span><span class="cap-stat-val">${snap.suministros}</span><span class="cap-stat-lbl">Suministros</span></div>
            <div class="cap-stat-cell"><span class="cap-stat-icon">\uD83D\uDEE1\uFE0F</span><span class="cap-stat-val">${snap.integridad}</span><span class="cap-stat-lbl">Integridad</span></div>
            <div class="cap-stat-cell"><span class="cap-stat-icon">\uD83D\uDC51</span><span class="cap-stat-val">${snap.autoridad}</span><span class="cap-stat-lbl">Autoridad</span></div>
        </div>
    </div>

    ${snap.perfil ? `
    <div class="cap-section">
        <div class="cap-section-title">\uD83D\uDCDD Perfil de liderazgo</div>
        <div class="cap-perfil-text">${snap.perfil}</div>
    </div>` : ''}

    ${snap.logros.length > 0 ? `
    <div class="cap-section">
        <div class="cap-section-title">\uD83C\uDFC6 Logros obtenidos (${snap.logros.length})</div>
        <div class="cap-logros-row">${logrosHTML}</div>
    </div>` : ''}

    <div class="cap-section">
        <div class="cap-puntaje">
            <span class="cap-puntaje-num">${snap.pts}</span>
            <span class="cap-puntaje-lbl">Puntos \u2014 Evento ${snap.eventos}/40</span>
        </div>
    </div>

    <div class="cap-footer-badges">
        <span class="cap-footer-badge ${difCls}">${difLabel[difCls] || difCls}</span>
        <span class="cap-footer-badge">${snap.eventos}/40 eventos</span>
        <span class="cap-footer-badge">${snap.fecha}</span>
    </div>
    </div>

    <div class="cap-footer">
        <span class="cap-footer-icon">\u269C</span>
        Era de los Descubrimientos \
        <span class="cap-footer-icon">\u269C</span>
        <span class="cap-footer-sub">ProfeD. \u2022 ${snap.fecha} ${snap.hora}</span>
    </div>
    </div>`;
}

export { guardarPartida, cargarPartida, guardarSnapshot, _detectarPerfil, cargarSnapshots, _buildCaptureCard, SNAPSHOTS_KEY, MAX_SNAPSHOTS };
