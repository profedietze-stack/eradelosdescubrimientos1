import { EVENTOS_FIJOS } from '../../data/eventosFijos.js';
import { POOL_EVENTOS } from '../../data/poolEventos.js';
import { DIFICULTAD_CONFIG } from '../../data/dificultad.js';
import { gameState, createInitialState } from '../gameState.js';
import { detectarContextoEvento, aplicarTooltips, siguienteFrase, _frasesQueue, mostrarFraseRandom, getNombreJugador } from '../utils.js';
import { animarFlotaYScroll } from '../map/shipAnimation.js';
import { actualizarVarsUI, mostrarDelta, actualizarAlertaPeligro, actualizarFaseViaje } from '../ui/statsUI.js';
import { mostrarToast } from '../ui/toast.js';
import { _lsSet } from '../storage/storage.js';
import { _sfxDecision, _sfxGameOver, _sfxLogro, _sfxHitoHistorico } from '../audio/audioManager.js';
import { stopBobbing, moverBarco } from '../map/shipRenderer.js';
import { mostrarHitoHistorico } from '../ui/modals.js';
import { mostrarPantalla } from '../ui/screenManager.js';
import { registrarPartidaEnStats, calcularPuntajePartida } from '../stats/statsEngine.js';
import { calcularLogros, renderizarLogros, renderizarBitacora, renderizarStats, renderizarPuntaje } from '../stats/logrosEngine.js';
import { guardarSnapshot } from '../storage/saveLoad.js';
import { _iniciarJuegoConFS } from '../ui/screenManager.js';
import { actualizarNombreJugador } from '../ui/statsUI.js';
import { getColonAdvice } from '../../data/colonAdvice.js';
import { mostrarTripulacionModal } from './crewModal.js';

let secuenciaActual = [];

function generarSecuenciaEventos() {
    const poolShuffled = [...POOL_EVENTOS].sort(() => Math.random() - 0.5);
    const secuencia = [];
    let poolIdx = 0;
    for (let i = 0; i < 40; i++) {
        const fixedKey = String(i);
        if (EVENTOS_FIJOS.hasOwnProperty(fixedKey)) {
            const ev = EVENTOS_FIJOS[fixedKey];
            secuencia.push({ ...ev });
        } else if (poolIdx < poolShuffled.length) {
            secuencia.push({ ...poolShuffled[poolIdx], id: poolShuffled[poolIdx].id });
            poolIdx++;
        }
    }
    return secuencia;
}

const CONSECUENCIAS_NARRATIVAS = {};

function mostrarConsecuencias(op, callback) {
    const panel = document.getElementById('consecuencias-panel');
    const textoEl = document.getElementById('cons-texto');
    const efectosEl = document.getElementById('cons-efectos');
    if (!panel || !textoEl || !efectosEl) { callback(); return; }
    const balanceEfectos = Object.values(op.efectos).reduce((a,v)=>a+(v||0),0);
    _sfxDecision(balanceEfectos >= 0);
    document.getElementById('options-container').style.opacity = '0.35';
    document.getElementById('options-container').style.pointerEvents = 'none';
    const efectos = op.efectos;
    const lineas = [];
    if ((efectos.moral || 0) > 0) lineas.push('La tripulación recibe la decisión con alivio y renovado ánimo.');
    if ((efectos.moral || 0) < -10) lineas.push('Un murmullo de descontento recorre la cubierta. Varios hombres evitan tu mirada.');
    if ((efectos.suministros || 0) > 10) lineas.push('Las bodegas se llenan y el olor a víveres frescos reanima a todos.');
    if ((efectos.suministros || 0) < -10) lineas.push('Los toneleros registran con preocupación el consumo de las reservas.');
    if ((efectos.integridad || 0) > 10) lineas.push('Los carpinteros de ribera refuerzan el casco con satisfacción artesana.');
    if ((efectos.integridad || 0) < -10) lineas.push('El crujir de la madera bajo el agua se vuelve más pronunciado.');
    if ((efectos.autoridad || 0) > 10) lineas.push('Tu decisión impone respeto. Los oficiales asienten con aprobación.');
    if ((efectos.autoridad || 0) < -10) lineas.push('Algunos marineros cuchichean a tus espaldas. Tu liderazgo se resiente.');
    if (op.cruel) lineas.push('⚠️ Esta decisión quedará marcada en el registro de la expedición.');
    textoEl.textContent = lineas.length > 0
        ? lineas.join(' ')
        : 'La decisión se ejecuta. El viaje continúa hacia el horizonte desconocido.';
    const iconos = { moral:'⚔️ Moral', suministros:'🍖 Suministros', integridad:'🛡️ Integridad', autoridad:'👑 Autoridad' };
    const dificConf = DIFICULTAD_CONFIG[gameState.dificultad];
    efectosEl.innerHTML = Object.entries(efectos)
        .filter(([,v]) => v !== 0)
        .map(([k, v]) => {
            const vReal = v < 0 ? Math.round(v * dificConf.multiplicadorNegativo) : (k === 'autoridad' && v > 0 ? Math.round(v * 0.65) : v);
            const cls = vReal > 0 ? 'pos' : 'neg';
            const sig = vReal > 0 ? '+' : '';
            return `<span class="cons-tag ${cls}">${iconos[k] || k} ${sig}${vReal}</span>`;
        }).join('') || '<span class="cons-tag neu">Sin efectos directos</span>';
    panel.style.display = 'block';
    const btnCont = document.getElementById('cons-btn-continuar');
    if (btnCont) btnCont.disabled = false;
    const gl = document.querySelector('.game-layout');
    if (gl && document.body.classList.contains('is-fullscreen')) {
        requestAnimationFrame(() => {
            gl.scrollTo({ top: gl.scrollHeight, behavior: 'smooth' });
        });
    } else {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    gameState._pendingContinuar = callback;
}

function continuarDespuesDeConsecuencias() {
    if (!gameState._pendingContinuar) return;
    const panel = document.getElementById('consecuencias-panel');
    if (panel) panel.style.display = 'none';
    const optCont = document.getElementById('options-container');
    if (optCont) { optCont.style.opacity = ''; optCont.style.pointerEvents = ''; }
    const cb = gameState._pendingContinuar;
    gameState._pendingContinuar = null;
    cb();
}

function cargarEvento(index) {
    if (index >= secuenciaActual.length) { finalizarJuego(); return; }
    const container = document.querySelector('.event-container');
    const ejecutarCarga = () => {
        gameState.currentEventIndex = index;
        const ev = secuenciaActual[index];
        const esHitoAmerica = ev.id === 'f12';
        const esRegreso = ev.id === 'f17';
        if (esRegreso && !gameState.azoresAplicado) {
            gameState.azoresAplicado = true;
            const reabDif = { estudiante: 12, historiador: 15, almirante: 18 };
            const difKey  = gameState.dificultad || 'historiador';
            const bonus   = reabDif[difKey] ?? 15;
            const antesS  = gameState.suministros;
            gameState.suministros = Math.min(100, gameState.suministros + bonus);
            const ganado  = gameState.suministros - antesS;
            if (ganado > 0) {
                setTimeout(() => mostrarToast(`🍖 +${ganado} Suministros — las Azores reponen las reservas para el último tramo`, 'ok'), 500);
            }
        }
        document.getElementById('evento-numero').textContent = index + 1;
        const eventTextEl = document.getElementById('event-text');
        eventTextEl.innerHTML = aplicarTooltips(ev.texto);
        const consultBtn = document.getElementById('btn-consultar-colon');
        if (consultBtn) {
            const advice = getColonAdvice(ev.id);
            consultBtn.style.display = advice ? '' : 'none';
            if (advice) {
                consultBtn.dataset.eventId = ev.id;
                consultBtn.replaceWith(consultBtn.cloneNode(true));
            }
            const freshBtn = document.getElementById('btn-consultar-colon');
            if (freshBtn) {
                const eid = ev.id;
                freshBtn.addEventListener('click', function handler(e) {
                    e.stopPropagation();
                    window.consultarColon(eid);
                });
            }
        }
        const optContainer = document.getElementById('options-container');
        optContainer.innerHTML = '';
        const esFinal = ev.opciones.length === 1;
        ev.opciones.forEach((op, i) => {
            const btn = document.createElement('button');
            btn.className = esFinal ? 'option-btn option-btn--final' : 'option-btn';
            btn.innerHTML = esFinal
                ? `▶ ${op.texto}`
                : `<strong>${String.fromCharCode(65 + i)}.</strong> ${op.texto}`;
            btn.onclick = () => elegirOpcion(op, ev.id);
            optContainer.appendChild(btn);
        });
        container.className = container.className.replace(/ctx-\w+|hito-especial/g, '').trim();
        if (esHitoAmerica) {
            container.classList.add('hito-especial');
        } else {
            const ctx = detectarContextoEvento(ev.texto);
            if (ctx) container.classList.add(ctx);
        }
        const eventHeader = document.querySelector('.event-header');
        const badgeExistente = document.getElementById('hito-badge-el');
        if (badgeExistente) badgeExistente.remove();
        if (esHitoAmerica && eventHeader) {
            const badge = document.createElement('div');
            badge.id = 'hito-badge-el';
            badge.style.cssText = 'text-align:center;margin-bottom:10px;';
            badge.innerHTML = '<span class="hito-badge">🌟 Hito Histórico — 12 de octubre de 1492</span>';
            eventHeader.insertAdjacentElement('beforebegin', badge);
        }
        container.classList.remove('saliendo', 'entrando');
        void container.offsetWidth;
        container.classList.add('entrando');
        container.addEventListener('animationend', () => container.classList.remove('entrando'), { once: true });
        const consPanel = document.getElementById('consecuencias-panel');
        if (consPanel) consPanel.style.display = 'none';
        actualizarVarsUI();
        actualizarFaseViaje(gameState.progress);
        actualizarAlertaPeligro();
        if (typeof moverBarco === 'function') moverBarco();
        mostrarFraseRandom();
        if (index > 0) {
            const secIds = secuenciaActual.map(ev => ev.id);
            const saveData = { gameState, nuncaCastigoCruel: gameState._nuncaCastigoCruel, moralMinima: gameState._moralMinima, secIds, dificultad: gameState.dificultad };
            const ok = _lsSet('columbusSave', JSON.stringify(saveData));
            if (ok) setTimeout(() => mostrarToast('💾 Partida guardada automáticamente', 'ok'), 600);
        }
        requestAnimationFrame(() => {
            const gl = document.querySelector('.game-layout');
            if (gl) gl.scrollTop = 0;
        });
        if (index > 0 && !esHitoAmerica && Math.random() < 0.25) {
            setTimeout(() => mostrarTripulacionModal(), 400);
        }
        if (esHitoAmerica) {
            setTimeout(() => {
                if (typeof mostrarHitoHistorico === 'function') {
                    mostrarHitoHistorico(() => {
                        mostrarToast('🍖 ¡Suministros reabastecidos con los recursos del Nuevo Mundo!', 'ok');
                    });
                }
            }, 350);
        }
    };
    if (index > 0) {
        container.classList.add('saliendo');
        let pending = true;
        const done = () => {
            if (!pending) return;
            pending = false;
            container.classList.remove('saliendo');
            ejecutarCarga();
        };
        container.addEventListener('animationend', done, { once: true });
        setTimeout(done, 600);
    } else {
        ejecutarCarga();
    }
}

function elegirOpcion(op, evId) {
    const _difKey = gameState.dificultad || 'historiador';
    const dConf = DIFICULTAD_CONFIG[_difKey] || DIFICULTAD_CONFIG.historiador;
    const mult = dConf.multiplicadorNegativo;
    const aplicarEfecto = (v) => v < 0 ? Math.round(v * mult) : v;
    gameState.moral        += aplicarEfecto(op.efectos.moral        || 0);
    gameState.suministros  += aplicarEfecto(op.efectos.suministros  || 0);
    gameState.integridad   += aplicarEfecto(op.efectos.integridad   || 0);
    const deltaAut = (op.efectos.autoridad || 0);
    const deltaAutReal = deltaAut > 0 ? Math.round(deltaAut * 0.65) : aplicarEfecto(deltaAut);
    gameState.autoridad += deltaAutReal;
    const decayAut = { estudiante: 1, historiador: 2, almirante: 3 }[_difKey] ?? 2;
    gameState.autoridad -= decayAut;
    const deltasVis = [
        { id: 'moral',       delta: aplicarEfecto(op.efectos.moral        || 0), barId: 'bar-moral' },
        { id: 'suministros', delta: aplicarEfecto(op.efectos.suministros  || 0), barId: 'bar-suministros' },
        { id: 'integridad',  delta: aplicarEfecto(op.efectos.integridad   || 0), barId: 'bar-integridad' },
        { id: 'autoridad',   delta: (deltaAutReal - decayAut),                    barId: 'bar-autoridad' },
    ];
    deltasVis.forEach(d => { if (d.delta !== 0) mostrarDelta(d.barId, d.delta); });
    const clampVal = v => Math.max(0, Math.min(100, Math.round(v)));
    gameState.moral       = clampVal(gameState.moral);
    gameState.suministros = clampVal(gameState.suministros);
    gameState.integridad  = clampVal(gameState.integridad);
    gameState.autoridad   = clampVal(gameState.autoridad);
    gameState.decisionsHistory.push({
        evento: evId,
        opcion: op.texto,
        efectos: op.efectos,
        eventoIdx: gameState.currentEventIndex + 1,
    });
    if (op.cruel === true) gameState._nuncaCastigoCruel = false;
    if (gameState.moral < gameState._moralMinima) gameState._moralMinima = gameState.moral;
    if (op.critico !== undefined) gameState.criticoCorrecto = op.critico;
    if (typeof stopBobbing === 'function') stopBobbing();
    gameState.progress++;
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    const consultBtn = document.getElementById('btn-consultar-colon');
    if (consultBtn) { consultBtn.style.display = 'none'; }
    actualizarVarsUI();
    if (gameState.moral <= 15 || gameState.suministros <= 8 || gameState.integridad <= 12) {
        finalizarJuegoTemprano();
        return;
    }
    const fromProg = gameState.progress - 1;
    const toProg   = gameState.progress;
    mostrarConsecuencias(op, () => {
        animarFlotaYScroll(fromProg, toProg, () => {
            cargarEvento(gameState.currentEventIndex + 1);
        });
    });
}

function mostrarPantallaFinal(tipo, titulo, subtitulo, descripcion, perfilHTML) {
    const tiempoSeg = gameState._partidaTimer ? Math.round((Date.now() - gameState._partidaTimer) / 1000) : 0;
    const { s } = registrarPartidaEnStats(tipo, tiempoSeg);
    gameState._partidaTimer = null;
    gameState._tipoResultadoActual = tipo;
    const banner = document.getElementById('end-banner');
    banner.className = 'end-banner ' + tipo;
    _sfxGameOver(tipo === 'victoria');
    document.getElementById('ending-title').innerHTML    = titulo;
    document.getElementById('ending-subtitle').innerHTML = subtitulo;
    document.getElementById('ending-description').innerHTML = descripcion;
    document.getElementById('perfil-liderazgo').innerHTML   = perfilHTML;
    renderizarStats();
    const logrosCalc = calcularLogros();
    const logrosObtenidos = logrosCalc.filter(l=>l.obtenido).length;
    if (logrosObtenidos > 0 && tipo === 'victoria') setTimeout(_sfxLogro, 900);
    renderizarLogros(logrosCalc);
    renderizarBitacora();
    const ptsObj = calcularPuntajePartida(tipo);
    renderizarPuntaje(ptsObj, tipo, s);
    setTimeout(() => guardarSnapshot(tipo), 100);
    mostrarPantalla('end-screen');
}

function finalizarJuego() {
    const m = gameState.moral, s = gameState.suministros,
          i = gameState.integridad, a = gameState.autoridad;
    let tipo, titulo, subtitulo, descripcion;
    if (m > 60 && i > 55 && a > 50 && s > 20) {
        tipo = 'victoria';
        titulo = '🌟 Llegada con gloria';
        subtitulo = '¡Descubriste un nuevo mundo!';
        descripcion = '<p>Las tres carabelas regresaron a España cargadas de noticias y tesoros. Tu nombre quedará grabado en la historia.</p><p>La Corona celebró tu hazaña y fuiste nombrado Almirante del Mar Océano.</p>';
    } else if (m <= 30 || a <= 28) {
        tipo = 'derrota';
        titulo = '⚔️ Motín sangriento';
        subtitulo = 'La tripulación se rebeló';
        descripcion = '<p>El miedo y el hambre fueron más fuertes que tu autoridad. La flota regresó a España sin llegar a las Indias.</p>';
    } else if (s <= 18 || i <= 20) {
        tipo = 'derrota';
        titulo = '🌊 Perdidos en el océano';
        subtitulo = 'Las naves no resistieron';
        descripcion = '<p>Sin suministros y con los navíos destrozados, la flota desapareció en las profundidades del Atlántico.</p>';
    } else {
        tipo = 'parcial';
        titulo = '🏝️ Llegada con dificultades';
        subtitulo = 'Lograste el descubrimiento, pero a un alto coste';
        descripcion = '<p>Llegaste a las nuevas tierras, pero muchos marineros perdieron la vida en el camino.</p><p>El descubrimiento fue real, aunque las condiciones de la travesía dejaron profundas cicatrices en la tripulación.</p>';
    }
    const nombre = gameState.playerName || gameState._playerName || 'Primer Oficial';
    const difLabels = { estudiante:'🎓 Estudiante', historiador:'📜 Historiador', almirante:'⚓ Almirante' };
    const perfilHTML = `
        <p><strong>Marinero:</strong> ${nombre} · <strong>Dificultad:</strong> ${difLabels[gameState.dificultad || 'historiador'] || 'Historiador'}.</p>
        <p><strong>Carácter:</strong> ${m > 60 ? 'Carismático y motivador' : 'Autoritario y pragmático'} · <strong>Gestión:</strong> ${s > 50 ? 'Excelente administrador' : 'Arriesgado'}.</p>
        <p><strong>Tecnología:</strong> ${gameState.criticoCorrecto === true ? 'Confiaste en instrumentos científicos' : 'Preferiste navegación por estima'} · <strong>Eventos:</strong> ${gameState.progress}/40.</p>`;
    mostrarPantallaFinal(tipo, titulo, subtitulo, descripcion, perfilHTML);
}

function finalizarJuegoTemprano() {
    const m = gameState.moral, s = gameState.suministros, i = gameState.integridad;
    let subtitulo = 'La expedición terminó antes de tiempo';
    let causa = '';
    if (m <= 15)  causa = 'La moral de la tripulación cayó en picado y se produjo un motín irreversible.';
    else if (s <= 8) causa = 'Los suministros se agotaron completamente. La tripulación no pudo sobrevivir.';
    else if (i <= 12) causa = 'Los navíos estaban tan dañados que terminaron hundiéndose.';
    const nombre2 = gameState.playerName || gameState._playerName || 'Primer Oficial';
    const perfilHTML = `
        <p><strong>Marinero:</strong> ${nombre2} · <strong>Eventos:</strong> ${gameState.progress}/40.</p>
        <p><strong>Punto de quiebre:</strong> ${causa}</p>`;
    mostrarPantallaFinal(
        'derrota',
        '🌊 Tragedia en alta mar',
        subtitulo,
        `<p>${causa}</p><p>El Atlántico se cobró su precio. Tus decisiones llevaron a la expedición a un final prematuro antes de avistar las Indias.</p>`,
        perfilHTML
    );
}

function _ejecutarInicioJuego() {
    const playerName = getNombreJugador();
    gameState._playerName = playerName;
    gameState.playerName = playerName;
    gameState._partidaTimer = Date.now();
    const dConf = DIFICULTAD_CONFIG[gameState.dificultad] || DIFICULTAD_CONFIG.historiador;
    const nuevoEstado = createInitialState(gameState.dificultad);
    Object.assign(gameState, nuevoEstado);
    gameState.playerName = gameState._playerName;
    gameState._nuncaCastigoCruel = true;
    gameState._moralMinima = dConf.statsBase.moral;
    gameState._hitoYaMostrado = false;
    _frasesQueue.length = 0;
    secuenciaActual.length = 0;
    secuenciaActual.push(...generarSecuenciaEventos());
    actualizarNombreJugador();
    _iniciarJuegoConFS(() => cargarEvento(0));
}

export { secuenciaActual, generarSecuenciaEventos, cargarEvento, elegirOpcion, mostrarConsecuencias, continuarDespuesDeConsecuencias, CONSECUENCIAS_NARRATIVAS, mostrarPantallaFinal, finalizarJuego, finalizarJuegoTemprano, _ejecutarInicioJuego };
