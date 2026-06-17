import { _mapState } from '../map/mapState.js';
import { initMap } from '../map/mapInit.js';
import { moverBarco } from '../map/shipRenderer.js';
import { mostrarToast } from './toast.js';

// ===== PANTALLA COMPLETA =====
// iOS Safari no soporta la Fullscreen API — detectamos soporte real
export const _fsSupported = !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.mozRequestFullScreen ||
    document.documentElement.msRequestFullscreen
);

export function entrarPantallaCompleta() {
    if (!_fsSupported) return; // iOS Safari: no hacer nada, no error
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (req) {
        req.call(el).catch(() => {
            mostrarToast('Pantalla completa no disponible en este navegador', 'ok');
        });
    }
}

export function salirPantallaCompleta() {
    const ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    if (ex) ex.call(document).catch(() => {});
}

export function togglePantallaCompleta() {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                    document.mozFullScreenElement || document.msFullscreenElement);
    if (isFS) {
        salirPantallaCompleta();
    } else {
        entrarPantallaCompleta();
    }
}

export function sincronizarEstadoFS() {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                    document.mozFullScreenElement || document.msFullscreenElement);
    document.body.classList.toggle('is-fullscreen', isFS);
    const btn = document.getElementById('btn-fs-toggle');
    if (btn) btn.title = isFS ? 'Salir de pantalla completa' : 'Pantalla completa';

    requestAnimationFrame(() => {
        const gl = document.querySelector('.game-layout');
        if (gl) gl.scrollTop = 0;
    });

    if (_mapState.ready) {
        setTimeout(() => {
            const container = document.getElementById('map-container');
            const canvas    = document.getElementById('ship-canvas');
            if (!container || !canvas) return;
            const W = container.offsetWidth  || window.innerWidth;
            const H = container.offsetHeight || 200;
            canvas.width = W; canvas.height = H;
            if (_mapState.svg) {
                _mapState.svg.attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
                _mapState.projection.translate([W/2, H/2]).scale(W * 1.05);
                _mapState.path = d3.geoPath().projection(_mapState.projection);
                _mapState.ready = false;
                _mapState.g && _mapState.g.remove();
                _mapState.svg.selectAll('rect:first-child').remove();
                initMap().then(() => { moverBarco(); }).catch(() => { moverBarco(); });
            }
        }, 150);
    }
}

document.addEventListener('fullscreenchange',       sincronizarEstadoFS);
document.addEventListener('webkitfullscreenchange', sincronizarEstadoFS);
document.addEventListener('mozfullscreenchange',    sincronizarEstadoFS);
document.addEventListener('MSFullscreenChange',     sincronizarEstadoFS);

export function mostrarPantalla(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id === 'game-screen') {
        const btn = document.getElementById('btn-fs-toggle');
        if (btn) {
            btn.style.display = _fsSupported ? '' : 'none';
            const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                            document.mozFullScreenElement || document.msFullscreenElement);
            btn.title = isFS ? 'Salir de pantalla completa' : 'Pantalla completa';
        }
        setTimeout(() => { if (!_mapState.ready) initMap(); }, 60);
    } else {
        const btn = document.getElementById('btn-fs-toggle');
        if (btn) btn.style.display = 'none';
    }
}

// ===== FIJAR ALTURA VENTANA (--real-vh) =====
export function _fijarAlturaVentana() {
    document.documentElement.style.setProperty('--real-vh', window.innerHeight + 'px');
}
_fijarAlturaVentana();
window.addEventListener('resize', _fijarAlturaVentana);
window.addEventListener('orientationchange', () => setTimeout(_fijarAlturaVentana, 200));
document.addEventListener('fullscreenchange',       _fijarAlturaVentana);
document.addEventListener('webkitfullscreenchange', _fijarAlturaVentana);
document.addEventListener('mozfullscreenchange',    _fijarAlturaVentana);

function _iniciarJuegoConFS(onReady) {
    mostrarPantalla('game-screen');

    if (!_fsSupported) {
        onReady();
        return;
    }

    const yaEnFS = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                      document.mozFullScreenElement || document.msFullscreenElement);
    if (yaEnFS) {
        requestAnimationFrame(() => requestAnimationFrame(onReady));
        return;
    }

    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen ||
                el.mozRequestFullScreen || el.msRequestFullscreen;

    const afterFS = () => {
        requestAnimationFrame(() => requestAnimationFrame(onReady));
    };

    if (req) {
        req.call(el).then(afterFS).catch(() => { onReady(); });
    } else {
        onReady();
    }
}

export { _iniciarJuegoConFS };
