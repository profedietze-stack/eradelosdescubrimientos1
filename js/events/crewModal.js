import { gameState } from '../gameState.js';
import { seleccionarComentario } from '../../data/crewComments.js';

let _callback = null;

export function mostrarTripulacionModal(cb) {
  const comment = seleccionarComentario(gameState);
  if (!comment) { if (cb) cb(); return; }

  _callback = cb || null;
  const modal = document.getElementById('crew-modal');
  const textEl = document.getElementById('crew-advice-text');
  if (!modal || !textEl) { if (cb) cb(); return; }

  textEl.textContent = comment;
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('visible'));
}

export function cerrarTripulacionModal() {
  const modal = document.getElementById('crew-modal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => {
    modal.style.display = 'none';
    if (_callback) { const cb = _callback; _callback = null; cb(); }
  }, 300);
}

document.addEventListener('click', (e) => {
  const modal = document.getElementById('crew-modal');
  if (!modal || modal.style.display !== 'flex') return;
  const panel = modal.querySelector('.crew-panel');
  if (panel && !panel.contains(e.target)) cerrarTripulacionModal();
});
