import { getColonAdvice } from '../../data/colonAdvice.js';

let _eventoActualId = null;

export function consultarColon(eventId) {
  _eventoActualId = eventId;
  const advice = getColonAdvice(eventId);
  if (!advice) {
    const modal = document.getElementById('colon-modal');
    if (modal) modal.style.display = 'none';
    return;
  }
  const modal = document.getElementById('colon-modal');
  const textEl = document.getElementById('colon-advice-text');
  if (!modal || !textEl) return;
  textEl.textContent = advice;
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('visible'));
}

export function cerrarConsultarColon() {
  const modal = document.getElementById('colon-modal');
  if (!modal) return;
  modal.classList.remove('visible');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
}

// Close when clicking backdrop outside panel
document.addEventListener('click', (e) => {
  const modal = document.getElementById('colon-modal');
  if (!modal || modal.style.display !== 'flex') return;
  const panel = modal.querySelector('.colon-panel');
  if (panel && !panel.contains(e.target)) cerrarConsultarColon();
});

export function getEventoActualId() {
  return _eventoActualId;
}
