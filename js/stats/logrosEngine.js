import { gameState } from '../gameState.js';
import { DIFICULTAD_CONFIG } from '../../data/dificultad.js';

const todosLosLogros = [
    { id:"maestro",       pts:150, nombre:"Maestro de la Ballestilla",    desc:"Confiaste en los instrumentos científicos en el momento crítico del evento 20.",           icon:"📐", cat:"Habilidad",
      condicion: () => gameState.criticoCorrecto === true },
    { id:"pacificador",   pts:120, nombre:"Pacificador de Motines",        desc:"La moral de la tripulación nunca bajó de 55 durante todo el viaje.",                       icon:"🕊️", cat:"Habilidad",
      condicion: () => gameState._moralMinima > 55 },
    { id:"economista",    pts:100, nombre:"Administrador de Hierro",       desc:"Los suministros terminaron por encima de 60 sin haber caído de 40 en ningún evento.",      icon:"🍖", cat:"Habilidad",
      condicion: () => gameState.suministros > 60 && gameState.progress >= 40 },
    { id:"explorador",    pts:100, nombre:"Casco de Hierro",               desc:"Los navíos llegaron al final con integridad superior a 70.",                               icon:"⛵", cat:"Habilidad",
      condicion: () => gameState.integridad > 70 && gameState.progress >= 40 },
    { id:"humanista",     pts:130, nombre:"Humanista del Mar",             desc:"Evitaste toda clase de castigos crueles durante la travesía completa.",                    icon:"❤️", cat:"Ética",
      condicion: () => gameState._nuncaCastigoCruel && gameState.progress >= 40 },
    { id:"diplomatico",   pts:80,  nombre:"Diplomático del Nuevo Mundo",   desc:"Llegaste al evento 30 con moral por encima de 50 y sin recurrir jamás a la violencia.",  icon:"🤝", cat:"Ética",
      condicion: () => gameState.progress >= 30 && gameState._nuncaCastigoCruel && gameState.moral >= 50 },
    { id:"legendario",    pts:200, nombre:"Almirante Legendario",          desc:"Llegaste con gloria: moral > 70, integridad > 65 y autoridad > 60 al finalizar.",         icon:"🏆", cat:"Victoria",
      condicion: () => gameState.moral > 70 && gameState.integridad > 65 && gameState.autoridad > 60 && gameState.progress >= 40 },
    { id:"perfecto",      pts:300, nombre:"El Gran Almirante del Mar",     desc:"Victoria con todas las variables por encima de 60 y sin castigos crueles.",               icon:"👑", cat:"Victoria",
      condicion: () => gameState.moral > 60 && gameState.suministros > 60 && gameState.integridad > 60 && gameState.autoridad > 60 && gameState._nuncaCastigoCruel && gameState.progress >= 40 },
    { id:"superviviente", pts:50,  nombre:"Superviviente del Atlántico",   desc:"Superaste el temible Mar de los Sargazos (completaste 8 eventos).",                       icon:"🌊", cat:"Progreso",
      condicion: () => gameState.progress >= 8 },
    { id:"resistente",    pts:80,  nombre:"Espíritu Indomable",            desc:"Llegaste a la mitad del viaje (evento 20) sin rendirte.",                                  icon:"🔥", cat:"Progreso",
      condicion: () => gameState.progress >= 20 },
    { id:"descubridor",   pts:120, nombre:"Descubridor de San Salvador",   desc:"Alcanzaste el Nuevo Mundo y desembarcaste en San Salvador (evento 29).",                   icon:"🏝️", cat:"Progreso",
      condicion: () => gameState.progress >= 29 },
    { id:"regreso",       pts:150, nombre:"El Regreso Triunfal",           desc:"Completaste los 40 eventos y regresaste a España.",                                        icon:"⚓", cat:"Progreso",
      condicion: () => gameState.progress >= 40 },
    { id:"prudente",      pts:70,  nombre:"Capitán Prudente",              desc:"Los suministros estaban por encima de 50 al finalizar la expedición.",                    icon:"🍞", cat:"Especial",
      condicion: () => gameState.suministros > 50 },
    { id:"ironico",       pts:60,  nombre:"La Paradoja de Colón",          desc:"Llegaste al destino creyendo estar en las Indias (completaste los 40 eventos).",          icon:"🗺️", cat:"Especial",
      condicion: () => gameState.progress >= 40 },
    { id:"tormenta",      pts:90,  nombre:"Sobreviviente de la Tormenta",  desc:"Llegaste al evento 37 sin que la integridad de los navíos cayera a cero.",               icon:"⛈️", cat:"Especial",
      condicion: () => gameState.progress >= 37 && gameState.integridad > 0 },
];

function calcularLogros() {
    return todosLosLogros.map(l => ({...l, obtenido: l.condicion()}));
}

function renderizarLogros(logrosCalc) {
    const cont = document.getElementById('logros-container');
    cont.innerHTML = '';
    const obtenidos  = logrosCalc.filter(l => l.obtenido);
    const bloqueados = logrosCalc.filter(l => !l.obtenido);
    if (obtenidos.length === 0) {
        cont.innerHTML = '<p style="color:#8b5a2b;text-align:center;font-size:0.85rem;grid-column:1/-1;">Ningún logro desbloqueado… ¡Inténtalo de nuevo!</p>';
        return;
    }
    obtenidos.forEach(l => {
        const div = document.createElement('div');
        div.className = 'logro-item';
        div.innerHTML = `<span class="logro-icon">${l.icon}</span><span class="logro-nombre">${l.nombre}</span><span class="logro-pts">+${l.pts}</span>`;
        cont.appendChild(div);
    });
    if (bloqueados.length > 0) {
        const info = document.createElement('p');
        info.style.cssText = 'color:#8b5a2b;text-align:center;font-size:0.75rem;grid-column:1/-1;margin-top:4px;opacity:0.7;';
        info.textContent = `${bloqueados.length} logros bloqueados — jugá de nuevo para desbloquearlos`;
        cont.appendChild(info);
    }
}

function renderizarBitacora() {
    const cont = document.getElementById('bitacora-container');
    if (!cont) return;
    cont.innerHTML = '';
    if (!gameState.decisionsHistory || gameState.decisionsHistory.length === 0) {
        cont.innerHTML = '<p style="color:var(--brown);font-size:0.85rem;opacity:0.7;">No hay decisiones registradas.</p>';
        return;
    }
    const iconos = { moral:'⚔️', suministros:'🍖', integridad:'🛡️', autoridad:'👑' };
    const difKey  = gameState.dificultad || 'historiador';
    const dConf   = DIFICULTAD_CONFIG[difKey] || DIFICULTAD_CONFIG.historiador;
    const mult    = dConf.multiplicadorNegativo;
    const decayAut = { estudiante: 1, historiador: 2, almirante: 3 }[difKey] ?? 2;
    const all = gameState.decisionsHistory;
    const total = all.length;
    const maxVisible = 10;
    const showAll = total <= maxVisible;
    const visible = showAll ? all : all.slice(-maxVisible);
    const contenedor = document.createElement('div');
    contenedor.id = 'bitacora-entries';
    visible.forEach((d, i) => {
        const div = document.createElement('div');
        div.className = 'bitacora-entrada';
        const tags = Object.entries(d.efectos)
            .filter(([,v]) => v !== 0)
            .map(([k, v]) => {
                let vReal;
                if (k === 'autoridad') {
                    const deltaPos = v > 0 ? Math.round(v * 0.65) : (v < 0 ? Math.round(v * mult) : 0);
                    vReal = deltaPos - decayAut;
                } else {
                    vReal = v < 0 ? Math.round(v * mult) : v;
                }
                const cls   = vReal > 0 ? 'pos' : 'neg';
                const signo = vReal > 0 ? '+' : '';
                return `<span class="bitacora-tag ${cls}">${iconos[k] || k} ${signo}${vReal}</span>`;
            }).join('');
        const numEvento = d.eventoIdx || (all.indexOf(d) + 1);
        div.innerHTML = `
            <div class="bitacora-num">${numEvento}</div>
            <div>
                <div style="font-size:0.65em;opacity:0.5;font-family:var(--font-header);letter-spacing:0.04em;margin-bottom:1px;">Evento ${numEvento}</div>
                <div style="font-size:0.85em;line-height:1.3;">${d.opcion}</div>
                <div class="bitacora-efectos">${tags}</div>
            </div>`;
        contenedor.appendChild(div);
    });
    cont.appendChild(contenedor);
    if (!showAll) {
        const toggle = document.createElement('button');
        toggle.id = 'bitacora-toggle';
        toggle.textContent = `📜 Ver las ${total} decisiones (mostrando últimas ${maxVisible})`;
        toggle.onclick = () => {
            const entries = document.getElementById('bitacora-entries');
            if (!entries) return;
            const isExpanded = entries.classList.toggle('expanded');
            toggle.textContent = isExpanded
                ? '📜 Mostrar menos'
                : `📜 Ver las ${total} decisiones (mostrando últimas ${maxVisible})`;
        };
        cont.appendChild(toggle);
    }
}

function renderizarStats() {
    const grid = document.getElementById('end-stats-grid');
    const stats = [
        {icon:'❤️', label:'Moral',      value: gameState.moral,       color:'#e74c3c'},
        {icon:'🍞', label:'Suministros', value: gameState.suministros, color:'#f1c40f'},
        {icon:'⛵', label:'Integridad',  value: gameState.integridad,  color:'#3498db'},
        {icon:'👑', label:'Autoridad',   value: gameState.autoridad,   color:'#9b59b6'},
    ];
    grid.innerHTML = stats.map(s => `
        <div class="end-stat-item">
            <span class="end-stat-icon">${s.icon}</span>
            <span class="end-stat-label">${s.label}</span>
            <span class="end-stat-value">${s.value}</span>
            <div class="end-stat-bar"><div class="end-stat-fill" style="width:${s.value}%;background:${s.color}"></div></div>
        </div>`).join('');
}

function renderizarPuntaje(ptsObj, tipo, statsGlobales) {
    const panel = document.getElementById('end-score-panel');
    if (!panel) return;
    const dif = gameState.dificultad || 'historiador';
    const difLabels = {
        estudiante: { label:'🎓 Estudiante', cls:'estudiante', multTxt:'×0.7' },
        historiador:{ label:'📜 Historiador', cls:'historiador', multTxt:'×1.0' },
        almirante:  { label:'⚓ Almirante',   cls:'almirante',  multTxt:'×1.5' },
    };
    const difCfg = difLabels[dif] || difLabels.historiador;
    const esRecord = statsGlobales && ptsObj.total >= (statsGlobales.mejorPuntaje || 0)
                     && statsGlobales.partidas > 1;
    const desglose = [
        { lbl: 'Base',      val: ptsObj.ptsBase },
        { lbl: 'Logros',    val: ptsObj.ptsLog  },
        { lbl: 'Eventos',   val: ptsObj.ptsEv   },
        { lbl: 'Moral',     val: ptsObj.ptsMor  },
        { lbl: 'Sumi.',     val: ptsObj.ptsSumi },
    ].filter(d => d.val > 0);
    panel.innerHTML = `
        <span class="score-label">⭐ Puntuación de la travesía</span>
        <div class="score-total">${ptsObj.total.toLocaleString('es-AR')}</div>
        <div>
            <span class="score-dif-badge ${difCfg.cls}">${difCfg.label} ${difCfg.multTxt}</span>
        </div>
        <div class="score-breakdown">
            ${desglose.map(d => `
                <div class="score-item">
                    <span class="score-item-val">+${d.val}</span>
                    <span>${d.lbl}</span>
                </div>`).join('')}
        </div>
        <div class="score-mult-line">
            Subtotal ${ptsObj.subtotal.toLocaleString('es-AR')} &nbsp;×&nbsp; ${difCfg.multTxt.replace('×','')} (${difCfg.label}) = <strong style="color:var(--gold-shine)">${ptsObj.total.toLocaleString('es-AR')} pts</strong>
        </div>
        ${esRecord ? '<div class="score-record">🏅 ¡Nuevo récord personal!</div>' : ''}
    `;
}

export { todosLosLogros, calcularLogros, renderizarLogros, renderizarBitacora, renderizarStats, renderizarPuntaje };
