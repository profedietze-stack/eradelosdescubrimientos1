import { frasesNavegantes } from '../data/frasesNavegantes.js';
import { GLOSARIO } from '../data/glosario.js';
import { GEO_LABELS, RUTA_COLON, GEO_FIJOS } from '../data/rutas.js';
import { gameState } from './gameState.js';

let _frasesQueue = [];

function siguienteFrase() {
    if (_frasesQueue.length === 0) {
        _frasesQueue = [...frasesNavegantes].sort(() => Math.random() - 0.5);
    }
    return _frasesQueue.pop();
}

function eventoARutaIdx(eventIdx) {
    if (GEO_FIJOS[eventIdx] !== undefined) return GEO_FIJOS[eventIdx];
    const fijosOrdenados = Object.keys(GEO_FIJOS).map(Number).sort((a, b) => a - b);
    let prevFijo = null, nextFijo = null;
    for (const f of fijosOrdenados) {
        if (f <= eventIdx) prevFijo = f;
        if (f >= eventIdx && nextFijo === null) nextFijo = f;
    }
    if (prevFijo === null) return GEO_FIJOS[fijosOrdenados[0]];
    if (nextFijo === null) return GEO_FIJOS[fijosOrdenados[fijosOrdenados.length - 1]];
    if (prevFijo === nextFijo) return GEO_FIJOS[prevFijo];
    const t = (eventIdx - prevFijo) / (nextFijo - prevFijo);
    return GEO_FIJOS[prevFijo] + (GEO_FIJOS[nextFijo] - GEO_FIJOS[prevFijo]) * t;
}

function progresoARutaIdx(prog) {
    return eventoARutaIdx(Math.round(prog));
}

function getRutaIdxForEventIndex(eventIdx) {
    return eventoARutaIdx(eventIdx);
}

function interpolarRuta(idx) {
    const i  = Math.floor(idx);
    const t  = idx - i;
    const p0 = RUTA_COLON[Math.min(i,     RUTA_COLON.length - 1)];
    const p1 = RUTA_COLON[Math.min(i + 1, RUTA_COLON.length - 1)];
    return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
}

function detectarContextoEvento(texto) {
    const t = texto.toLowerCase();
    if (/motín|amotinado|rebeló|cabecilla|colgar|azot|pena de muerte|sublevac/i.test(t)) return 'ctx-peligro';
    if (/crítico|¡evento crítico|astrolabio|ballestilla|instrumento/i.test(t)) return 'ctx-critico';
    if (/tormenta|ola|naufragio|arrecife|hundió|tifón|temporal|borrasca/i.test(t)) return 'ctx-peligro';
    if (/tierra|isla|caribe|taíno|playa|costa|bahía|puerto|indias/i.test(t)) return 'ctx-tierra';
    if (/océano|mar|oleaje|corriente|navegac|atlántico|viento|vela|sargazo/i.test(t)) return 'ctx-mar';
    return '';
}

function _fmtTiempo(seg) {
    if (!seg) return '0 min';
    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    const s = seg % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function _labelRes(r) {
    return r === 'victoria' ? '? Victoria' : r === 'parcial' ? '??? Parcial' : '?? Derrota';
}

function aplicarTooltips(texto) {
    const terminos = Object.keys(GLOSARIO).sort((a,b) => b.length - a.length);
    let resultado = texto;
    const marcadores = {};
    let idx = 0;
    const WB_PRE  = '(?<![\\wáéíóúàèìòùâêîôûãõäëïöüçñÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÇÑ])';
    const WB_POST = '(?![\\wáéíóúàèìòùâêîôûãõäëïöüçñÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÇÑ])';
    for (const term of terminos) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`${WB_PRE}(${escaped})${WB_POST}`, 'i');
        resultado = resultado.replace(re, (match) => {
            const key = `\x00T${idx++}\x00`;
            const tip = GLOSARIO[term].replace(/"/g, '&quot;');
            marcadores[key] = `<span class="tooltip-term" tabindex="0" data-tip="${tip}">${match}</span>`;
            return key;
        });
    }
    for (const [key, val] of Object.entries(marcadores)) {
        resultado = resultado.replace(key, () => val);
    }
    return resultado;
}

function nombreAleatorio() {
    const MARINEROS_HISTORICOS = [
        'Rodrigo de Triana', 'Juan de la Cosa', 'Diego de Arana',
        'Pedro Alonso Niño', 'Luis de Torres', 'Bartolomé Roldán',
        'Chachu', 'Gonzalo Fernández', 'Juan Quintero', 'Bartolomé García',
        'Francisco Morales', 'Alonso Clavijo', 'Sancho Ruiz de Gama',
        'Juan Niño', 'García Fernández', 'Pero Gutiérrez', 'Rodrigo Sánchez',
        'Juan Vizcaíno', 'Domingo de Lequeitio', 'Francisco de Morales',
    ];
    const nombre = MARINEROS_HISTORICOS[Math.floor(Math.random() * MARINEROS_HISTORICOS.length)];
    elegirNombre(nombre);
    const input = document.getElementById('nombre-marinero');
    if (input) {
        input.style.transition = 'transform 0.1s';
        input.style.transform = 'scale(1.04)';
        setTimeout(() => { input.style.transform = 'scale(1)'; }, 120);
    }
}

function elegirNombre(nombre) {
    const input = document.getElementById('nombre-marinero');
    if (input) input.value = nombre;
}

function getNombreJugador() {
    const input = document.getElementById('nombre-marinero');
    const val   = input ? input.value.trim() : '';
    return val || 'Primer Oficial';
}

function mostrarFraseRandom() {
    const idx = gameState.currentEventIndex;
    const label = GEO_LABELS[idx];
    const el = document.getElementById('frase-random');
    if (label) {
        el.textContent = label;
        el.style.fontStyle = 'normal';
        el.style.fontWeight = '600';
        el.style.color = 'var(--brown-dark)';
    } else {
        el.textContent = siguienteFrase();
        el.style.fontStyle = '';
        el.style.fontWeight = '';
        el.style.color = '';
    }
}

function calcularAnguloFlota(idx, mapProjection) {
    const idxN = Math.min(idx + 1.5, RUTA_COLON.length - 1);
    const [lon0, lat0] = interpolarRuta(idx);
    const [lon1, lat1] = interpolarRuta(idxN);
    const [bx0, by0]  = mapProjection([lon0, lat0]);
    const [bx1, by1]  = mapProjection([lon1, lat1]);
    let angle = Math.atan2(by1 - by0, bx1 - bx0);
    if (angle > Math.PI / 2)  angle -= Math.PI;
    if (angle < -Math.PI / 2) angle += Math.PI;
    return angle;
}

export { _frasesQueue, siguienteFrase, eventoARutaIdx, progresoARutaIdx, getRutaIdxForEventIndex, interpolarRuta, easeInOutCubic, detectarContextoEvento, _fmtTiempo, _labelRes, aplicarTooltips, nombreAleatorio, elegirNombre, getNombreJugador, mostrarFraseRandom, calcularAnguloFlota };
