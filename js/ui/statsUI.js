import { gameState } from '../gameState.js';
import { FASES_VIAJE } from '../../data/rutas.js';
import { moverBarco } from '../map/shipRenderer.js';

export function actualizarVarsUI() {
    const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
    gameState.moral        = clamp(gameState.moral);
    gameState.suministros  = clamp(gameState.suministros);
    gameState.integridad   = clamp(gameState.integridad);
    gameState.autoridad    = clamp(gameState.autoridad);

    const statMap = [
        { id: 'moral',       barId: 'bar-moral',        valId: 'valor-moral',        color: '#e74c3c', critico: 20, advertencia: 35 },
        { id: 'suministros', barId: 'bar-suministros',  valId: 'valor-suministros',  color: '#f1c40f', critico: 15, advertencia: 30 },
        { id: 'integridad',  barId: 'bar-integridad',   valId: 'valor-integridad',   color: '#3498db', critico: 18, advertencia: 30 },
        { id: 'autoridad',   barId: 'bar-autoridad',    valId: 'valor-autoridad',    color: '#9b59b6', critico: 20, advertencia: 35 },
    ];
    statMap.forEach(s => {
        const val = gameState[s.id];
        const bar = document.getElementById(s.barId);
        const valEl = document.getElementById(s.valId);
        valEl.textContent = val;
        bar.style.width = val + '%';
        bar.classList.remove('peligro', 'advertencia');
        if (val <= s.critico) {
            bar.classList.add('peligro');
            bar.style.backgroundColor = '';
        } else if (val <= s.advertencia) {
            bar.classList.add('advertencia');
            bar.style.backgroundColor = '';
        } else {
            bar.style.backgroundColor = s.color;
        }
    });

    const prog = Math.round((gameState.progress / 40) * 100);
    document.getElementById('progreso-text').textContent = prog + '%';
    document.getElementById('dia-actual').textContent    = Math.min(72, Math.round(gameState.progress * 1.8));
}

export function mostrarDelta(barId, delta) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    const item = bar.closest('.var-item') || bar.closest('.stat-cell');
    if (!item) return;
    item.querySelectorAll('.stat-delta').forEach(el => el.remove());
    const el = document.createElement('span');
    el.className = 'stat-delta ' + (delta > 0 ? 'positivo' : 'negativo');
    el.textContent = (delta > 0 ? '+' : '') + delta;
    item.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
}

export function actualizarAlertaPeligro() {
    const el = document.getElementById('alerta-peligro');
    if (!el) return;
    const alertas = [];
    if (gameState.moral <= 35)       alertas.push(`<strong>⚔️ Moral crítica (${gameState.moral})</strong> — Un paso más y la tripulación se amotina.`);
    if (gameState.suministros <= 30) alertas.push(`<strong>🍖 Suministros escasos (${gameState.suministros})</strong> — El hambre acecha. Cuida los recursos.`);
    if (gameState.integridad <= 30)  alertas.push(`<strong>🛡️ Navíos dañados (${gameState.integridad})</strong> — Las carabelas no aguantarán mucho más.`);
    if (gameState.autoridad <= 35)   alertas.push(`<strong>👑 Autoridad débil (${gameState.autoridad})</strong> — Tu mando se desmorona. La tripulación duda de ti.`);

    if (alertas.length > 0) {
        el.innerHTML = '⚠️ ' + alertas.join(' &nbsp;·&nbsp; ');
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

export function actualizarFaseViaje(progress) {
    const fase = FASES_VIAJE.find(f => progress >= f.desde && progress < f.hasta)
               || FASES_VIAJE[FASES_VIAJE.length - 1];
    const el = document.getElementById('fase-viaje');
    const dot = el?.querySelector('.fase-dot');
    const texto = document.getElementById('fase-texto');
    if (el && dot && texto) {
        dot.style.background = fase.dot;
        texto.textContent = fase.label;
        el.style.color = fase.color;
    }
}

export function actualizarNombreJugador() {
    const title = document.querySelector('.vars-title');
    if (title && gameState._playerName && gameState._playerName !== 'Primer Oficial') {
        title.textContent = gameState._playerName;
    }
}
