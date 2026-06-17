import { _mapState } from './mapState.js';
import { progresoARutaIdx, easeInOutCubic } from '../utils.js';
import { stopBobbing, renderShipsAt, renderShipsAtIdx, startBobbing } from './shipRenderer.js';
import { updateTrail, updateTrailAt, zoomToFleet } from './mapInit.js';
import { _sfxMoverBarco } from '../audio/audioManager.js';

function animarFlotaYScroll(fromProgress, toProgress, onDone) {
    const mapContainer = document.getElementById('map-container');

    _sfxMoverBarco();

    const enFullscreen = document.body.classList.contains('is-fullscreen');
    if (!enFullscreen && mapContainer) {
        const mapTop = mapContainer.getBoundingClientRect().top + window.scrollY - 8;
        window.scrollTo({ top: Math.max(0, mapTop), behavior: 'smooth' });
    }

    if (!_mapState.ready) {
        onDone && onDone();
        return;
    }

    let checkCount = 0;
    const MAX_CHECKS = 20;

    const waitAndAnimate = setInterval(() => {
        checkCount++;

        const scrollOk = enFullscreen || !mapContainer || checkCount > 2
            ? true
            : (() => {
                const rect = mapContainer.getBoundingClientRect();
                return rect.top >= -10 && rect.top <= window.innerHeight * 0.6;
            })();

        if (scrollOk) {
            clearInterval(waitAndAnimate);
            startShipAnimation(fromProgress, toProgress, () => {
                onDone && onDone();
            });
            return;
        }

        if (checkCount >= MAX_CHECKS) {
            clearInterval(waitAndAnimate);
            onDone && onDone();
        }
    }, 80);
}

function startShipAnimation(fromProgress, toProgress, onDone) {
    if (_mapState.anim.rafId) cancelAnimationFrame(_mapState.anim.rafId);
    stopBobbing();

    _mapState.anim.fromIdx  = progresoARutaIdx(fromProgress);
    _mapState.anim.toIdx    = progresoARutaIdx(toProgress);
    _mapState.anim.start    = performance.now();
    _mapState.anim.duration = 2800;
    _mapState.anim.active   = true;
    _mapState.anim.onDone   = onDone;

    function tick(now) {
        const elapsed = now - _mapState.anim.start;
        const raw     = Math.min(elapsed / _mapState.anim.duration, 1);
        const t       = easeInOutCubic(raw);

        const curIdx  = _mapState.anim.fromIdx + (_mapState.anim.toIdx - _mapState.anim.fromIdx) * t;

        updateTrailAt(curIdx);
        renderShipsAtIdx(curIdx);

        if (raw < 1) {
            _mapState.anim.rafId = requestAnimationFrame(tick);
        } else {
            _mapState.anim.active  = false;
            _mapState.anim.rafId   = null;
            updateTrail(toProgress);
            renderShipsAt(toProgress);
            zoomToFleet(toProgress, true);
            setTimeout(startBobbing, 300);
            _mapState.anim.onDone && _mapState.anim.onDone();
        }
    }

    _mapState.anim.rafId = requestAnimationFrame(tick);
}

export { animarFlotaYScroll, startShipAnimation };
