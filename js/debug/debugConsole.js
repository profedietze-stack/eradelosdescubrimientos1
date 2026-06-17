import { gameState } from '../gameState.js';
import { getErrorLog } from './errorCapture.js';

let panel = null;
let visible = false;

const styles = `
#debug-panel { position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:rgba(0,0,0,0.88);color:#0f0;font-family:monospace;font-size:13px;display:none;flex-direction:column;padding:8px;box-sizing:border-box;pointer-events:auto; }
#debug-panel.open { display:flex; }
#debug-header { display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap; }
#debug-header button { background:#333;color:#0f0;border:1px solid #0f0;padding:3px 10px;cursor:pointer;font-family:monospace;font-size:12px; }
#debug-header button:hover { background:#0f0;color:#000; }
#debug-header .close { margin-left:auto;background:#800;border-color:#f00;color:#f00; }
#debug-header .close:hover { background:#f00;color:#fff; }
#debug-content { flex:1;overflow:auto;white-space:pre-wrap;word-break:break-all;line-height:1.4; }
#debug-content table { width:100%;border-collapse:collapse;font-size:12px; }
#debug-content td,#debug-content th { padding:2px 6px;border:1px solid #444;text-align:left;vertical-align:top; }
#debug-content th { background:#222;color:#0f0;font-weight:700; }
#debug-content tr:nth-child(even) { background:rgba(255,255,255,0.03); }
.debug-err { color:#f66 !important; }
.debug-warn { color:#fa0 !important; }
`;

function createPanel() {
    if (panel) return;
    const s = document.createElement('style');
    s.textContent = styles; document.head.appendChild(s);
    panel = document.createElement('div'); panel.id = 'debug-panel';
    panel.innerHTML = `
    <div id="debug-header">
        <button data-tab="state">Estado</button>
        <button data-tab="events">Eventos</button>
        <button data-tab="storage">Storage</button>
        <button data-tab="stats">Stats</button>
        <button data-tab="errors">Errores</button>
        <button class="close">Cerrar [F12]</button>
    </div>
    <div id="debug-content"></div>`;
    document.body.appendChild(panel);
    panel.querySelector('#debug-header').addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.classList.contains('close')) { toggle(); return; }
        renderTab(b.dataset.tab);
    });
    document.addEventListener('keydown', e => { if (e.key === 'F12') { e.preventDefault(); toggle(); } });
    renderTab('state');
}

function renderTab(tab) {
    const el = document.getElementById('debug-content');
    if (!el) return;
    const m = { state: renderState, events: renderEvents, storage: renderStorage, stats: renderStats, errors: renderErrors };
    el.innerHTML = (m[tab] || renderState)();
}

function renderState() {
    const g = gameState;
    const rows = [
        ['playerName', g.playerName], ['dificultad', g.dificultad],
        ['progress', g.progress], ['currentEventIndex', g.currentEventIndex],
        ['moral', g.moral], ['suministros', g.suministros],
        ['integridad', g.integridad], ['autoridad', g.autoridad],
        ['_nuncaCastigoCruel', g._nuncaCastigoCruel],
        ['_moralMinima', g._moralMinima], ['_hitoYaMostrado', g._hitoYaMostrado],
        ['criticoCorrecto', g.criticoCorrecto],
        ['hitoAmericaAplicado', g.hitoAmericaAplicado],
        ['azoresAplicado', g.azoresAplicado],
        ['_partidaTimer', g._partidaTimer ? new Date(g._partidaTimer).toLocaleTimeString() : null],
        ['_tipoResultadoActual', g._tipoResultadoActual],
        ['decisionsHistory', (g.decisionsHistory||[]).length + ' decisiones'],
    ];
    return '<table>' + rows.map(([k,v]) => `<tr><th>${k}</th><td>${v==null?'—':esc(JSON.stringify(v))}</td></tr>`).join('') + '</table>';
}

function renderEvents() {
    const sec = window.__secuenciaActual;
    if (!sec || !sec.length) return '<em>No hay partida activa. Iniciá un juego primero.</em>';
    return '<table><tr><th>#</th><th>ID</th><th>Texto (80 chars)</th><th>Opciones</th></tr>' +
        sec.map((ev,i) =>
            `<tr${i===gameState.currentEventIndex?' style="background:#0f0;color:#000"':''}>
                <td>${i}</td><td>${ev.id}</td>
                <td>${esc((ev.texto||'').substring(0,80))}${ev.texto?.length>80?'…':''}</td>
                <td>${ev.opciones?.length||0}</td>
            </tr>`
        ).join('') + '</table>';
}

function renderStorage() {
    const keys = ['columbusSave', 'colon_stats', 'colon_snapshots_v1', '_debugErrors'];
    let html = '<table><tr><th>Key</th><th>Tamaño</th><th>Contenido (primeros 100)</th></tr>';
    for (const k of keys) {
        try {
            const v = localStorage.getItem(k);
            if (v === null) { html += `<tr><td>${k}</td><td colspan="2"><em>no existe</em></td></tr>`; continue; }
            html += `<tr><td>${k}</td><td>${(new Blob([v])).size} B</td><td style="font-size:11px;word-break:break-all;">${esc(v.substring(0,100))}${v.length>100?'…':''}</td></tr>`;
        } catch(e) { html += `<tr><td>${k}</td><td colspan="2">error: ${esc(e.message)}</td></tr>`; }
    }
    html += '</table>';
    return html;
}

function renderStats() {
    try {
        const raw = localStorage.getItem('colon_stats');
        if (!raw) return '<em>No hay estadísticas guardadas.</em>';
        const s = JSON.parse(raw);
        const rows = Object.entries(s).map(([k,v]) => [k, JSON.stringify(v)]);
        return '<table>' + rows.map(([k,v]) => `<tr><th>${k}</th><td>${esc(v)}</td></tr>`).join('') + '</table>';
    } catch(e) { return '<em>Error: ' + esc(e.message) + '</em>'; }
}

function renderErrors() {
    const log = getErrorLog();
    if (!log.length) return '<em>No hay errores registrados.</em>';
    return '<table><tr><th>Hora</th><th>Nivel</th><th>Origen</th><th>Mensaje</th></tr>' +
        log.map(e =>
            `<tr class="debug-${e.level}">
                <td style="font-size:11px">${(e.time||'').substring(11,19)}</td>
                <td>${e.level}</td><td>${e.source}</td>
                <td>${esc(e.message||'')}</td>
            </tr>`
        ).join('') + '</table>';
}

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

export function toggle() {
    if (!panel) createPanel();
    visible = !visible;
    panel.classList.toggle('open', visible);
    if (visible) renderTab('state');
}
