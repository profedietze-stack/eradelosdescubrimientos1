// ===== TOAST =====
export let _toastTimer = null;
export function mostrarToast(msg, tipo = 'ok') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = tipo === 'error' ? '#7a1a1a' : '#3c2f2f';
    t.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}
