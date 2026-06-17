import { mostrarPantalla, _fsSupported } from './screenManager.js';
import { gameState } from '../gameState.js';
import { _ejecutarInicioJuego } from '../events/eventLoader.js';
import { _sfxHitoHistorico, _sfxLogro } from '../audio/audioManager.js';
import { mostrarToast } from './toast.js';
import { actualizarVarsUI } from './statsUI.js';
import { cargarPartida } from '../storage/saveLoad.js';
import { cargarStats, _statsDefault, calcularPuntajePartida, resetearStats } from '../stats/statsEngine.js';
import { calcularLogros, todosLosLogros, renderizarLogros, renderizarBitacora, renderizarStats, renderizarPuntaje } from '../stats/logrosEngine.js';
import { DIFICULTAD_CONFIG } from '../../data/dificultad.js';
import { _lsSet } from '../storage/storage.js';
import { _fmtTiempo, _labelRes, nombreAleatorio, elegirNombre, getNombreJugador } from '../utils.js';
import { verSnapshot } from './captureUI.js';
import { cargarSnapshots, _buildCaptureCard } from '../storage/saveLoad.js';

// ===== CONFIRMAR VOLVER AL INICIO DESDE JUEGO =====
export function confirmarVolverAlInicio() {
    if (gameState.progress === 0) { volverAlInicio(); return; }
    mostrarConfirm('¿Abandonar la travesía y volver al menú principal? El progreso no guardado se perderá.', volverAlInicio);
}

// ===== DIFICULTAD =====
export function seleccionarDificultad(dif, btn) {
    // Store difficulty on gameState (mutable object reference) instead of gameState.dificultad (read-only import)
    gameState.dificultad = dif;
    document.querySelectorAll('.dif-btn').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    document.getElementById('dif-desc-text').textContent = DIFICULTAD_CONFIG[dif].label;
}

// ===== BRIEFING =====
export function mostrarBriefing() {
    if (_fsSupported) {
        const yaEnFS = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                          document.mozFullScreenElement || document.msFullscreenElement);
        if (!yaEnFS) {
            const el = document.documentElement;
            const req = el.requestFullscreen || el.webkitRequestFullscreen ||
                        el.mozRequestFullScreen || el.msRequestFullscreen;
            if (req) req.call(el).catch(() => {});
        }
    }

    const modal = document.getElementById('briefing-modal');
    modal.classList.add('visible');
    const panel = modal.querySelector('.briefing-panel');
    if (panel) panel.scrollTop = 0;

    const input = document.getElementById('nombre-marinero');
    if (input && !input.value.trim()) nombreAleatorio();

    document.getElementById('briefing-btn-iniciar').onclick = () => {
        gameState.playerName = getNombreJugador();
        modal.classList.remove('visible');
        _ejecutarInicioJuego();
    };
}

export function iniciarJuego() {
    mostrarBriefing();
}

// ===== CONFIRM MODAL =====
export function mostrarConfirm(msg, onYes) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-msg').textContent = msg;
    modal.style.display = 'flex';
    const yes = document.getElementById('confirm-yes');
    const no  = document.getElementById('confirm-no');
    const cerrar = () => { modal.style.display = 'none'; yes.onclick = null; no.onclick = null; };
    yes.onclick = () => { cerrar(); onYes(); };
    no.onclick  = cerrar;
}

export function mostrarInfo()             { mostrarPantalla('info-screen'); }
export function volverAlInicio()          { mostrarPantalla('start-screen'); }
export function reiniciarJuego()          { mostrarConfirm('¿Querés reiniciar el viaje desde el principio?', mostrarBriefing); }
export function reiniciarJuegoDesdeFinal(){ _ejecutarInicioJuego(); }

// ===== TOOLTIPS DE STICKERS (touch) =====
(function() {
    function initStickerTooltips() {
        const stickers = document.querySelectorAll('.stickers-row .sticker');
        let active = null;

        function closeAll() {
            stickers.forEach(s => s.classList.remove('tip-on'));
            active = null;
        }

        stickers.forEach(sticker => {
            sticker.addEventListener('touchend', e => {
                e.preventDefault();
                const isOpen = sticker.classList.contains('tip-on');
                closeAll();
                if (!isOpen) {
                    sticker.classList.add('tip-on');
                    active = sticker;
                }
            }, { passive: false });
        });

        document.addEventListener('touchstart', e => {
            if (active && !active.contains(e.target)) closeAll();
        }, { passive: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStickerTooltips);
    } else {
        initStickerTooltips();
    }
})();

// ===== LOGROS & STATS MODAL =====
export function abrirLogrosStats() {
    const modal = document.getElementById('logros-modal');
    modal.classList.add('visible');
    modal.scrollTop = 0;
    const panel = modal.querySelector('.ls-panel');
    if (panel) panel.scrollTop = 0;
    const nom = gameState._playerName || gameState?.playerName || '';
    document.getElementById('ls-nombre-header').textContent =
        nom ? `${nom} — Flota de Cristóbal Colón` : 'Flota de Cristóbal Colón';
    lsTab(gameState._lsTabActual);
}

export function cerrarLogrosStats() {
    document.getElementById('logros-modal').classList.remove('visible');
}

export function lsTab(tab) {
    gameState._lsTabActual = tab;
    document.querySelectorAll('.ls-tab').forEach(t => t.classList.remove('activo'));
    document.querySelectorAll('.ls-tab-content').forEach(c => c.classList.remove('activo'));
    const btn = document.querySelector(`.ls-tab[data-tab="${tab}"]`);
    if (btn) btn.classList.add('activo');
    const cont = document.getElementById(`ls-tab-${tab}`);
    if (cont) cont.classList.add('activo');
    const render = { overview: renderLsOverview, logros: renderLsLogros, historial: renderLsHistorial, rendimiento: renderLsRendimiento };
    if (render[tab]) render[tab]();
}

// ─── TAB OVERVIEW ─────────────────────────────────────────────────────
function renderLsOverview() {
    const s = cargarStats();
    const winPct = s.partidas > 0 ? Math.round((s.victorias / s.partidas) * 100) : 0;
    const totalLogros = todosLosLogros.length;
    const logrosUniq  = (s.logrosTotal || []).length;
    const avgEvs = s.partidas > 0 ? Math.round(s.eventosTotal / s.partidas) : 0;
    const tiempoFmt = _fmtTiempo(s.tiempoJuegoSeg);
    const avgMoral = s.promedioMoral?.length ? Math.round(s.promedioMoral.reduce((a,b)=>a+b,0)/s.promedioMoral.length) : 0;

    const mpd = s.mejorPuntajePorDif || {};
    const avg = arr => arr?.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;

    const cards = [
        { icon:'⚓', val: s.partidas,        lbl:'Partidas'          },
        { icon:'🏆', val: s.victorias,        lbl:'Victorias'         },
        { icon:'💀', val: s.derrotas,         lbl:'Derrotas'          },
        { icon:'🏝️', val: s.parciales,        lbl:'Parciales'         },
        { icon:'📊', val: `${winPct}%`,       lbl:'% Victorias'       },
        { icon:'⭐', val: s.puntajeTotal,     lbl:'Puntos totales'    },
        { icon:'🥇', val: s.mejorPuntaje,     lbl:'Mejor puntaje'     },
        { icon:'🔥', val: s.rachaVictorias,   lbl:'Racha máx. vict.'  },
        { icon:'📜', val: avgEvs,             lbl:'Eventos prom.'     },
        { icon:'🏅', val:`${logrosUniq}/${totalLogros}`,lbl:'Logros obtenidos'},
        { icon:'⏱️', val: tiempoFmt,          lbl:'Tiempo de juego'   },
        { icon:'⚔️', val: avgMoral,           lbl:'Moral promedio'    },
    ];

    document.getElementById('ls-cards-container').innerHTML = cards.map(c => `
        <div class="ls-stat-card">
            <span class="ls-stat-icon">${c.icon}</span>
            <span class="ls-stat-value">${c.val}</span>
            <span class="ls-stat-label">${c.lbl}</span>
        </div>`).join('');

    document.getElementById('ls-bars-container').innerHTML = `
        <div class="ls-section-title" style="margin-bottom:10px;">🏆 Mejor puntaje por dificultad</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
            ${[
                { dif:'estudiante', icon:'🎓', label:'Estudiante', color:'#27ae60', bg:'rgba(39,174,96,0.1)'  },
                { dif:'historiador',icon:'📜', label:'Historiador',color:'#2980b9', bg:'rgba(52,152,219,0.1)' },
                { dif:'almirante',  icon:'⚓', label:'Almirante',  color:'#c0392b', bg:'rgba(192,57,43,0.1)'  },
            ].map(d => `
                <div style="background:${d.bg};border:1px solid ${d.color}40;border-radius:8px;padding:8px;text-align:center;">
                    <div style="font-size:1.2rem;">${d.icon}</div>
                    <div style="font-family:var(--font-header);font-weight:700;font-size:clamp(1rem,2vw,1.3rem);color:${d.color};">${(mpd[d.dif]||0).toLocaleString('es-AR')}</div>
                    <div style="font-family:var(--font-header);font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--brown-muted);margin-top:2px;">${d.label}</div>
                </div>`).join('')}
        </div>
        <div class="ls-section-title" style="margin-bottom:8px;">📈 Estadísticas de campaña</div>
        ${[
        { lbl:'Moral promedio',        val: avg(s.promedioMoral),  color:'#e74c3c' },
        { lbl:'Suministros promedio',  val: avg(s.promedioSumi),   color:'#e8b420' },
        { lbl:'Integridad promedio',   val: avg(s.promedioInteg),  color:'#3498db' },
        { lbl:'Autoridad promedio',    val: avg(s.promedioAuto),   color:'#9b59b6' },
        { lbl:'Eventos completados %', val: s.partidas > 0 ? Math.round((s.eventosTotal/(s.partidas*40))*100) : 0, color:'#27ae60' },
        ].map(b => `
        <div class="ls-stat-bar-row">
            <span class="ls-stat-bar-label">${b.lbl}</span>
            <div class="ls-stat-bar-track"><div class="ls-stat-bar-fill" style="width:${b.val}%;background:${b.color}"></div></div>
            <span class="ls-stat-bar-val">${b.val}${b.lbl.includes('%') ? '%' : '/100'}</span>
        </div>`).join('')}
    `;

    const ult = s.historial?.[0];
    const difLabelsOv = { estudiante:'🎓 Estudiante', historiador:'📜 Historiador', almirante:'⚓ Almirante' };
    document.getElementById('ls-ultima-partida').innerHTML = ult
        ? `<strong>${ult.nombre}</strong> — ${ult.fecha} ${ult.hora} · 
           Dificultad: <strong>${difLabelsOv[ult.dificultad] || 'Historiador'}</strong> · 
           Resultado: <span class="ls-resultado-pill ${ult.resultado}">${_labelRes(ult.resultado)}</span> · 
           Eventos: ${ult.eventos}/40 · Puntaje: <strong>${ult.pts}</strong> pts · 
           Logros: ${ult.logros}/${totalLogros}`
        : '<em>Aún no hay partidas registradas.</em>';
}

// ─── TAB LOGROS ───────────────────────────────────────────────────────
function renderLsLogros() {
    const s    = cargarStats();
    const uniq = new Set(s.logrosTotal || []);

    const hayPartidaActiva = gameState && gameState.progress > 0;
    const condicionSegura = (l) => {
        if (!hayPartidaActiva) return false;
        try { return !!l.condicion(); } catch { return false; }
    };

    const logrosRender = todosLosLogros.map(l => ({
        ...l,
        obtenido:    condicionSegura(l) || uniq.has(l.id),
        estaPartida: condicionSegura(l),
    }));

    const obtenidos  = logrosRender.filter(l => l.obtenido);
    const bloqueados = logrosRender.filter(l => !l.obtenido);
    const ptsTotales = obtenidos.reduce((a,l) => a + (l.pts||0), 0);
    const ptsMax     = todosLosLogros.reduce((a,l) => a + (l.pts||0), 0);

    document.getElementById('ls-logros-resumen').innerHTML =
        `<strong>${obtenidos.length}/${todosLosLogros.length}</strong> logros desbloqueados · 
         <strong>${ptsTotales}</strong>/${ptsMax} pts posibles`;

    const cats = [...new Set(todosLosLogros.map(l => l.cat))];
    let html = '';
    cats.forEach(cat => {
        const grupo = logrosRender.filter(l => l.cat === cat);
        html += `<div class="ls-section-title">${cat}</div><div class="ls-logros-grid">`;
        grupo.sort((a,b) => b.obtenido - a.obtenido).forEach(l => {
            html += `
            <div class="ls-logro-card${l.obtenido ? '' : ' bloqueado'}">
                <div class="ls-logro-medal">${l.obtenido ? l.icon : '🔒'}</div>
                <div class="ls-logro-info">
                    <span class="ls-logro-nombre">${l.nombre}</span>
                    <span class="ls-logro-desc">${l.desc}</span><br>
                    <span class="ls-logro-badge ${l.obtenido ? 'ok' : 'no'}">${l.obtenido ? '✔ Obtenido' : '🔒 Bloqueado'}</span>
                    <span class="ls-logro-badge pts">⭐ ${l.pts} pts</span>
                </div>
            </div>`;
        });
        html += `</div>`;
    });
    document.getElementById('ls-logros-grid').innerHTML = html;
}

// ─── TAB HISTORIAL ────────────────────────────────────────────────────
function renderLsHistorial() {
    renderLsPantallas();
    const s = cargarStats();
    const h = s.historial || [];
    if (!h.length) {
        document.getElementById('ls-historial-container').innerHTML =
            `<div class="ls-empty"><span>📜</span>Aún no hay partidas registradas.<br>¡Zarpa y escribe tu historia!</div>`;
        return;
    }
    const difBadge = (d) => {
        const map = {
            estudiante: { label:'🎓 Estudiante', bg:'rgba(39,174,96,0.18)',  color:'#1a7a40' },
            historiador:{ label:'📜 Historiador', bg:'rgba(52,152,219,0.18)', color:'#1a5276' },
            almirante:  { label:'⚓ Almirante',   bg:'rgba(192,57,43,0.18)',  color:'#922b21' },
        };
        const cfg = map[d] || map.historiador;
        return `<span style="display:inline-block;padding:2px 7px;border-radius:20px;font-family:var(--font-header);font-weight:700;font-size:0.62rem;letter-spacing:0.04em;background:${cfg.bg};color:${cfg.color}">${cfg.label}</span>`;
    };
    const filas = h.map((e, i) => `
        <tr>
            <td>${i+1}</td>
            <td><strong>${e.nombre || '—'}</strong></td>
            <td>${e.fecha} ${e.hora}</td>
            <td><span class="ls-resultado-pill ${e.resultado}">${_labelRes(e.resultado)}</span></td>
            <td>${difBadge(e.dificultad)}</td>
            <td>${e.eventos}/40</td>
            <td>❤️${e.moral} 🍖${e.suministros} 🛡️${e.integridad} 👑${e.autoridad}</td>
            <td>${e.logros}/${todosLosLogros.length}</td>
            <td><strong>${e.pts}</strong></td>
            <td>${_fmtTiempo(e.tiempoSeg)}</td>
            <td>${e.crueldad ? '⚠️ Sí' : '✅ No'}</td>
        </tr>`).join('');

    document.getElementById('ls-historial-container').innerHTML = `
        <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table class="ls-historial-tabla">
            <thead><tr>
                <th>#</th><th>Marinero</th><th>Fecha</th><th>Resultado</th>
                <th>Dificultad</th><th>Eventos</th><th>Stats finales</th><th>Logros</th>
                <th>Puntaje</th><th>Tiempo</th><th>Crueldad</th>
            </tr></thead>
            <tbody>${filas}</tbody>
        </table></div>`;
}

// ─── TAB RENDIMIENTO PEDAGÓGICO ───────────────────────────────────────
function renderLsRendimiento() {
    const s = cargarStats();
    const h = s.historial || [];
    const total = todosLosLogros.length;

    const sinCrueldad   = h.filter(e => !e.crueldad).length;
    const pctEtico      = h.length ? Math.round((sinCrueldad/h.length)*100) : 0;
    const pctVictorias  = s.partidas ? Math.round((s.victorias/s.partidas)*100) : 0;
    const pctComplecion = s.partidas ? Math.round((s.eventosTotal/(s.partidas*40))*100) : 0;
    const logrosUniq    = (s.logrosTotal||[]).length;
    const avgPts        = s.partidas ? Math.round(s.puntajeTotal/s.partidas) : 0;
    const uniq          = new Set(s.logrosTotal||[]);
    const logrosEtica   = todosLosLogros.filter(l=>l.cat==='Ética' && uniq.has(l.id)).length;
    const logrosHab     = todosLosLogros.filter(l=>l.cat==='Habilidad' && uniq.has(l.id)).length;
    const logrosVic     = todosLosLogros.filter(l=>l.cat==='Victoria' && uniq.has(l.id)).length;

    let nivel = '🔴 Iniciante', color = '#c0392b';
    if (avgPts >= 800) { nivel = '🟣 Legendario'; color = '#8e44ad'; }
    else if (avgPts >= 600) { nivel = '🟡 Veterano'; color = '#c8960c'; }
    else if (avgPts >= 400) { nivel = '🟢 Competente'; color = '#27ae60'; }
    else if (avgPts >= 200) { nivel = '🔵 Aprendiz'; color = '#2980b9'; }

    const indicadores = [
        { lbl:'Tasa de victoria',        val: pctVictorias,  color:'#27ae60', suf:'%' },
        { lbl:'Completación promedio',    val: pctComplecion, color:'#3498db', suf:'%' },
        { lbl:'Decisiones sin crueldad',  val: pctEtico,      color:'#e74c3c', suf:'%' },
        { lbl:'Logros desbloqueados',     val: Math.round((logrosUniq/total)*100), color:'#f39c12', suf:'%' },
        { lbl:'Puntaje promedio / 1000',  val: Math.min(100, Math.round(avgPts/10)), color:'#9b59b6', suf:'' },
    ];

    document.getElementById('ls-rendimiento-container').innerHTML = `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px;flex-wrap:wrap;">
            <div style="font-size:2.8rem;">${nivel.split(' ')[0]}</div>
            <div>
                <div style="font-family:var(--font-title);font-size:clamp(1rem,2.5vw,1.5rem);color:${color};font-weight:700;">${nivel.split(' ').slice(1).join(' ')}</div>
                <div style="font-family:var(--font-body);font-size:0.88rem;color:var(--ink-soft);">Puntaje promedio: <strong>${avgPts}</strong> pts por partida</div>
            </div>
        </div>

        <div class="ls-section-title">📊 Indicadores de desempeño</div>
        ${indicadores.map(b => `
        <div class="ls-stat-bar-row">
            <span class="ls-stat-bar-label">${b.lbl}</span>
            <div class="ls-stat-bar-track"><div class="ls-stat-bar-fill" style="width:${b.val}%;background:${b.color}"></div></div>
            <span class="ls-stat-bar-val">${b.val}${b.suf}</span>
        </div>`).join('')}

        <div class="ls-section-title">🏅 Logros por categoría</div>
        <div class="ls-overview-grid" style="grid-template-columns:repeat(auto-fill,minmax(110px,1fr));">
            ${[
                { lbl:'Ética',     val: logrosEtica,  tot: todosLosLogros.filter(l=>l.cat==='Ética').length,     icon:'❤️' },
                { lbl:'Habilidad', val: logrosHab,    tot: todosLosLogros.filter(l=>l.cat==='Habilidad').length, icon:'📐' },
                { lbl:'Victoria',  val: logrosVic,    tot: todosLosLogros.filter(l=>l.cat==='Victoria').length,  icon:'🏆' },
                { lbl:'Progreso',  val: todosLosLogros.filter(l=>l.cat==='Progreso' && uniq.has(l.id)).length,
                                   tot: todosLosLogros.filter(l=>l.cat==='Progreso').length, icon:'🔥' },
                { lbl:'Especial',  val: todosLosLogros.filter(l=>l.cat==='Especial' && uniq.has(l.id)).length,
                                   tot: todosLosLogros.filter(l=>l.cat==='Especial').length, icon:'🗺️' },
            ].map(c => `
                <div class="ls-stat-card">
                    <span class="ls-stat-icon">${c.icon}</span>
                    <span class="ls-stat-value">${c.val}/${c.tot}</span>
                    <span class="ls-stat-label">${c.lbl}</span>
                </div>`).join('')}
        </div>

        <div class="ls-section-title">📋 Para el docente</div>
        <div style="font-family:var(--font-body);font-size:clamp(0.82rem,1.6vw,0.95rem);line-height:1.75;color:var(--ink-soft);">
            <p>• <strong>Partidas jugadas:</strong> ${s.partidas} &nbsp;|&nbsp; <strong>Victorias:</strong> ${s.victorias} &nbsp;|&nbsp; <strong>Derrotas:</strong> ${s.derrotas}</p>
            <p>• <strong>Por dificultad:</strong>
                🎓 Estudiante: ${h.filter(e=>e.dificultad==='estudiante').length} partidas
                (${h.filter(e=>e.dificultad==='estudiante'&&e.resultado==='victoria').length} victorias) &nbsp;·&nbsp;
                📜 Historiador: ${h.filter(e=>(!e.dificultad||e.dificultad==='historiador')).length} partidas
                (${h.filter(e=>(!e.dificultad||e.dificultad==='historiador')&&e.resultado==='victoria').length} victorias) &nbsp;·&nbsp;
                ⚓ Almirante: ${h.filter(e=>e.dificultad==='almirante').length} partidas
                (${h.filter(e=>e.dificultad==='almirante'&&e.resultado==='victoria').length} victorias)
            </p>
            <p>• <strong>Tiempo total:</strong> ${_fmtTiempo(s.tiempoJuegoSeg)} &nbsp;|&nbsp; <strong>Decisiones tomadas:</strong> ${s.decisionesTotal}</p>
            <p>• <strong>Ética en las decisiones:</strong> ${pctEtico}% de partidas sin castigos crueles.</p>
            <p>• <strong>Mejor puntaje obtenido:</strong> ${s.mejorPuntaje} pts &nbsp;|&nbsp; <strong>Mejor moral final:</strong> ${s.mejorMoral}/100</p>
            <p>• <strong>Racha máxima de victorias:</strong> ${s.rachaVictorias} seguidas.</p>
            <p style="margin-top:10px;padding:8px 12px;background:rgba(200,150,12,0.08);border-left:3px solid var(--gold);border-radius:4px;">
                <em>Esta pantalla puede ser usada por el alumno para mostrar su desempeño al docente. Los datos persisten entre sesiones del navegador.</em>
            </p>
        </div>`;
}

// Renderizar las pantallas guardadas en el tab Historial
function renderLsPantallas() {
    const snaps = cargarSnapshots();
    const cont  = document.getElementById('ls-pantallas-grid');
    if (!cont) return;
    if (!snaps.length) {
        cont.innerHTML = `<div class="ls-empty" style="margin-bottom:0;padding:12px;"><span>📸</span>Aún no hay partidas guardadas.<br>Al terminar una partida, se guarda automáticamente.</div>`;
        return;
    }
    const emojiTipo = { victoria:'🏆', parcial:'🌊', derrota:'💀' };
    const cards = snaps.map((s, i) => `
        <div class="ls-pantalla-card ${s.tipo}" data-idx="${i}">
            <div class="ls-pantalla-top">
                <span class="ls-pantalla-resultado">${emojiTipo[s.tipo]||'🌊'}</span>
                <span class="ls-pantalla-nombre">${s.nombre || '—'}</span>
            </div>
            <span class="ls-pantalla-meta">${s.fecha} ${s.hora} · Ev. ${s.eventos}/40</span>
            <span class="ls-pantalla-pts">⭐ ${s.pts} pts</span>
            <span class="ls-pantalla-ver">📸 Toca para ver y capturar →</span>
        </div>`).join('');
    cont.innerHTML = `<div class="ls-pantallas-grid-inner">${cards}</div>`;
    cont.querySelectorAll('.ls-pantalla-card').forEach(card => {
        card.addEventListener('click', () => verSnapshot(parseInt(card.dataset.idx)));
    });
}

// ===== OVERLAY HITO HISTÓRICO =====
let _hitoCallback = null;

export function mostrarHitoHistorico(onClose) {
    if (gameState._hitoYaMostrado) { onClose && onClose(); return; }
    gameState._hitoYaMostrado = true;

    let suministrosGanados = 0;
    if (!gameState.hitoAmericaAplicado) {
        const suministrosActuales = gameState.suministros;
        suministrosGanados = Math.max(0, 50 - suministrosActuales);
        gameState.suministros = Math.max(gameState.suministros, 50);
        gameState.hitoAmericaAplicado = true;
    }

    document.getElementById('hito-suministros-ganados').textContent = suministrosGanados;
    const premioEl = document.getElementById('hito-premio-texto');
    if (suministrosGanados === 0) {
        premioEl.innerHTML = '🍖 Suministros completos — las tierras americanas refuerzan las reservas';
        premioEl.style.color = 'rgba(248,208,96,0.75)';
    } else {
        premioEl.innerHTML = `🍖 +${suministrosGanados} Suministros — las tierras americanas reponen las reservas de la flota`;
        premioEl.style.color = '#7debb0';
    }

    _hitoCallback = onClose;

    const overlay = document.getElementById('hito-overlay');
    overlay.classList.add('visible');

    setTimeout(() => { _sfxHitoHistorico(); }, 200);

    const btn = overlay.querySelector('.hito-btn');
    btn.disabled = true;
    btn.style.cursor = 'default';
    btn.style.opacity = '0';
    setTimeout(() => {
        btn.disabled = false;
        btn.style.cursor = 'pointer';
    }, 2800);
}

export function cerrarHitoOverlay() {
    const overlay = document.getElementById('hito-overlay');
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.classList.remove('visible');
        overlay.style.opacity = '';
        overlay.style.transition = '';
        actualizarVarsUI();
        if (_hitoCallback) { _hitoCallback(); _hitoCallback = null; }
    }, 500);
}
