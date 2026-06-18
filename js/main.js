import * as d3 from 'd3';
import * as topojson from 'topojson-client';
window.d3 = d3;
window.topojson = topojson;

import { gameState, createInitialState } from './gameState.js';
import { _frasesQueue, siguienteFrase, eventoARutaIdx, progresoARutaIdx, getRutaIdxForEventIndex, interpolarRuta, easeInOutCubic, detectarContextoEvento, _fmtTiempo, _labelRes, aplicarTooltips, nombreAleatorio, elegirNombre, getNombreJugador, mostrarFraseRandom, calcularAnguloFlota } from './utils.js';
import { secuenciaActual, generarSecuenciaEventos, cargarEvento, elegirOpcion, mostrarConsecuencias, continuarDespuesDeConsecuencias, CONSECUENCIAS_NARRATIVAS, mostrarPantallaFinal, finalizarJuego, finalizarJuegoTemprano, _ejecutarInicioJuego } from './events/eventLoader.js';
import { _mapState } from './map/mapState.js';
import { initMap, updateTrail, updateTrailAt, drawCompassRoseD3, zoomToFleet, mapZoom, mapReset } from './map/mapInit.js';
import { drawCaravel, _drawFormacion, renderShipsAt, renderShipsAtIdx, renderShipsAtOffset, startBobbing, stopBobbing, moverBarco } from './map/shipRenderer.js';
import { animarFlotaYScroll, startShipAnimation } from './map/shipAnimation.js';
import { _checkStorage, _lsSet, _lsGet } from './storage/storage.js';
import { guardarPartida, cargarPartida, guardarSnapshot, _detectarPerfil, cargarSnapshots, _buildCaptureCard } from './storage/saveLoad.js';
import { STATS_KEY, _statsDefault, cargarStats, guardarStats, calcularPuntajePartida, registrarPartidaEnStats, resetearStats } from './stats/statsEngine.js';
import { todosLosLogros, calcularLogros, renderizarLogros, renderizarBitacora, renderizarStats, renderizarPuntaje } from './stats/logrosEngine.js';
import { _AudioCtxClass, _audioCtx, _masterGain, _ambientNodes, _audioEnabled, _audioInitialized, _initAudio, _resumeAudio, _startOleaje, _stopOleaje, _sfxDecision, _sfxMoverBarco, _sfxLogro, _sfxGameOver, _sfxHitoHistorico, toggleAudio } from './audio/audioManager.js';
import { _toastTimer, mostrarToast } from './ui/toast.js';
import { mostrarPantalla, entrarPantallaCompleta, salirPantallaCompleta, sincronizarEstadoFS, _fsSupported, _fijarAlturaVentana, _iniciarJuegoConFS, togglePantallaCompleta } from './ui/screenManager.js';
import { actualizarVarsUI, mostrarDelta, actualizarAlertaPeligro, actualizarFaseViaje, actualizarNombreJugador } from './ui/statsUI.js';
import { confirmarVolverAlInicio, seleccionarDificultad, mostrarBriefing, iniciarJuego, mostrarConfirm, mostrarInfo, volverAlInicio, reiniciarJuego, reiniciarJuegoDesdeFinal, abrirLogrosStats, cerrarLogrosStats, lsTab, mostrarHitoHistorico, cerrarHitoOverlay } from './ui/modals.js';
import { consultarColon, cerrarConsultarColon } from './events/colonConsult.js';
import { mostrarTripulacionModal, cerrarTripulacionModal } from './events/crewModal.js';
import { prepararCaptura, cerrarCaptura, verSnapshot } from './ui/captureUI.js';
import './tools/tooltipSystem.js';
import './debug/errorCapture.js';
import { toggle as toggleDebug } from './debug/debugConsole.js';
import { initErrorBanner, toggleErrorPanel, limpiarErrores } from './debug/errorBanner.js';

window.iniciarJuego = iniciarJuego;
window.cargarPartida = cargarPartida;
window.abrirLogrosStats = abrirLogrosStats;
window.cerrarLogrosStats = cerrarLogrosStats;
window.mostrarInfo = mostrarInfo;
window.volverAlInicio = volverAlInicio;
window.seleccionarDificultad = seleccionarDificultad;
window.nombreAleatorio = nombreAleatorio;
window.elegirNombre = elegirNombre;
window.lsTab = lsTab;
window.resetearStats = resetearStats;
window.mapZoom = mapZoom;
window.mapReset = mapReset;
window.toggleAudio = toggleAudio;
window.guardarPartida = guardarPartida;
window.continuarDespuesDeConsecuencias = continuarDespuesDeConsecuencias;
window.reiniciarJuego = reiniciarJuego;
window.confirmarVolverAlInicio = confirmarVolverAlInicio;
window.reiniciarJuegoDesdeFinal = reiniciarJuegoDesdeFinal;
window.salirPantallaCompleta = salirPantallaCompleta;
window.togglePantallaCompleta = togglePantallaCompleta;
window.cerrarHitoOverlay = cerrarHitoOverlay;
window.consultarColon = consultarColon;
window.cerrarConsultarColon = cerrarConsultarColon;
window.mostrarTripulacionModal = mostrarTripulacionModal;
window.cerrarTripulacionModal = cerrarTripulacionModal;
window.__secuenciaActual = secuenciaActual;
window.prepararCaptura = prepararCaptura;
window.cerrarCaptura = cerrarCaptura;
window.verSnapshot = verSnapshot;
window._toggleErrorPanel = toggleErrorPanel;
window._limpiarErrores = limpiarErrores;

// Splash progress: fill to 80% during module evaluation
let _progressInterval = null;
function _iniciarProgressSplash() {
    const bar = document.getElementById('splash-progress');
    const status = document.getElementById('splash-status');
    if (!bar) return;
    let p = 0;
    _progressInterval = setInterval(() => {
        if (p < 75) { p += 2 + Math.random() * 3; if (p > 75) p = 75; }
        bar.style.width = p + '%';
        const msgs = ['Preparando la flota...', 'Izando velas...', 'Reclutando marineros...', 'Cargando provisiones...', 'Consultando mapas...', 'Ultimando detalles...'];
        if (status) status.textContent = msgs[Math.floor(p / 15) % msgs.length];
    }, 200);
}

function _finalizarSplash() {
    if (_progressInterval) { clearInterval(_progressInterval); _progressInterval = null; }
    const bar = document.getElementById('splash-progress');
    const status = document.getElementById('splash-status');
    const btn = document.getElementById('splash-btn');
    if (bar) bar.style.width = '100%';
    if (status) status.textContent = 'Listo para zarpar';
    setTimeout(() => {
        if (btn) btn.style.display = 'inline-block';
    }, 500);
}

window._comenzar = function() {
    const splash = document.getElementById('splash-screen');
    const btn = document.getElementById('splash-btn');
    if (btn) btn.style.display = 'none';
    // Enter fullscreen if supported (iOS Safari ignores silently)
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (req) {
        req.call(el).catch(() => {});
    }
    // Transition to start screen
    if (splash) {
        splash.classList.add('hidden');
        setTimeout(() => { splash.style.display = 'none'; }, 600);
    }
};

// Start splash progress immediately
_iniciarProgressSplash();

window.onload = () => {
    initErrorBanner();
    // Complete loading and show button
    _finalizarSplash();

    let lastTap = 0;
    document.addEventListener('touchend', e => {
        const now = Date.now();
        if (now - lastTap < 300 && e.target.tagName === 'BUTTON') e.preventDefault();
        lastTap = now;
    }, { passive: false });

    console.log('%cEra de los Descubrimientos — cargado.', 'color:#c8960c;font-size:1rem');

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        const colon    = document.getElementById('colon-modal');
        const briefing = document.getElementById('briefing-modal');
        const logros   = document.getElementById('logros-modal');
        const confirm  = document.getElementById('confirm-modal');
        if (colon    && colon.style.display === 'flex')           { cerrarConsultarColon(); return; }
        if (briefing && briefing.classList.contains('visible'))   { briefing.classList.remove('visible'); return; }
        if (logros   && logros.classList.contains('visible'))     { cerrarLogrosStats(); return; }
        if (confirm  && confirm.style.display === 'flex')         { confirm.style.display = 'none'; return; }
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const sw = reg.installing;
                sw.addEventListener('statechange', () => {
                    if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                        setTimeout(() => mostrarToast && mostrarToast('Nueva versión disponible — recargá para actualizar', 'ok'), 1000);
                    }
                });
            });
        }).catch(() => {});
    }
};
