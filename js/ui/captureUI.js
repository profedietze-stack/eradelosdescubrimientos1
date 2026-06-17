import { cargarSnapshots, _buildCaptureCard, _detectarPerfil } from '../storage/saveLoad.js';
import { gameState } from '../gameState.js';
import { calcularLogros } from '../stats/logrosEngine.js';
import { calcularPuntajePartida } from '../stats/statsEngine.js';

// Mostrar overlay de captura con la partida actual
export function prepararCaptura() {
    const snap = {
        tipo:        gameState._tipoResultadoActual || 'parcial',
        nombre:      gameState.playerName || gameState._playerName || 'Primer Oficial',
        dificultad:  gameState.dificultad || 'historiador',
        moral:       gameState.moral,
        suministros: gameState.suministros,
        integridad:  gameState.integridad,
        autoridad:   gameState.autoridad,
        eventos:     gameState.progress,
        logros:      calcularLogros().filter(l => l.obtenido).map(l => ({ icon:l.icon, nombre:l.nombre })),
        perfil:      _detectarPerfil(),
        pts:         calcularPuntajePartida(gameState._tipoResultadoActual || 'parcial').total,
        titulo:      document.getElementById('ending-title')?.textContent || '',
        subtitulo:   document.getElementById('ending-subtitle')?.textContent || '',
        fecha:       new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'2-digit' }),
        hora:        new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' }),
    };

    document.getElementById('capture-card').innerHTML = _buildCaptureCard(snap);

    const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const hint      = document.getElementById('capture-hint');
    if (isIOS)     hint.innerHTML = '<span style="font-size:1.2rem;">📱</span> iOS: botón lateral + subir volumen';
    else if (isAndroid) hint.innerHTML = '<span style="font-size:1.2rem;">📱</span> Android: bajar volumen + encendido';
    else           hint.innerHTML = '<span style="font-size:1.2rem;">🖥️</span> PC: Impr Pant o <kbd>Win+Shift+S</kbd>';

    const overlay = document.getElementById('capture-overlay');
    overlay.style.display = 'block';
    overlay.scrollTop = 0;

    const exitFS = document.exitFullscreen || document.webkitExitFullscreen ||
                   document.mozCancelFullScreen || document.msExitFullscreen;
    if (exitFS && (document.fullscreenElement || document.webkitFullscreenElement)) {
        exitFS.call(document).catch(() => {});
    }
}

export function cerrarCaptura() {
    document.getElementById('capture-overlay').style.display = 'none';
}

// Mostrar snapshot guardado en overlay
export function verSnapshot(idx) {
    const snaps = cargarSnapshots();
    const snap  = snaps[idx];
    if (!snap) return;
    document.getElementById('capture-card').innerHTML = _buildCaptureCard(snap);
    const hint = document.getElementById('capture-hint');
    hint.textContent = '📸 Tomá una captura de pantalla ahora';
    const overlay = document.getElementById('capture-overlay');
    overlay.style.display = 'block';
    overlay.scrollTop = 0;
}
