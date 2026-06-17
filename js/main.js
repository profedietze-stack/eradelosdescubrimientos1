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

window.onload = () => {
    initErrorBanner();
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

    // Ocultar loader de carga una vez que los módulos están listos
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.classList.add('loaded');
        setTimeout(() => { loader.style.display = 'none'; }, 600);
    }

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
