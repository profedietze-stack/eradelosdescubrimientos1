const _INSTRUMENTOS = [
    { id: 'astrolabio', label: 'Astrolabio', icon: '\u2699\uFE0F', desc: 'Instrumento de cobre que mide el \u00e1ngulo del sol sobre el horizonte para calcular la latitud. Gira la alidada (brazo) arrastr\u00e1ndola con el dedo o mouse.' },
    { id: 'brujula', label: 'Br\u00fajula', icon: '\uD83E\uDEED', desc: 'Aguja imantada que siempre se\u00f1ala el norte magn\u00e9tico. Sacudila r\u00e1pido (click repetido o agit\u00e1 el dispositivo) para verla temblar y volver al norte.' },
    { id: 'ballestilla', label: 'Ballestilla', icon: '\uD83D\uDCCF', desc: 'Vara de madera en forma de cruz para medir la altura del sol o las estrellas. Arrastr\u00e1 el travesa\u00f1o hacia arriba o abajo para cambiar la medici\u00f3n.' },
    { id: 'cuadrante', label: 'Cuadrante', icon: '\uD83D\uDCD0', desc: 'Instrumento de cuarto de c\u00edrculo para medir \u00e1ngulos del sol y estrellas. Hac\u00e9 click en la plomada para soltarla y verla oscilar.' },
];

let _estadoAstrolabio = { arrastrando: false, angulo: 0 };
let _estadoBallestilla = { arrastrando: false, offsetY: 0 };
let _estadoCuadrante = { angulo: 0, velocidad: 0, soltado: false, animId: null, ultimoT: null };
let _estadoBrujula = { sacudidas: [], temporizadorShake: null, shakeAnim: false };

function _crearBotones() {
    const existing = document.querySelector('.instrumentos-row');
    if (existing) existing.remove();
    const row = document.createElement('div');
    row.className = 'instrumentos-row';
    _INSTRUMENTOS.forEach(inst => {
        const btn = document.createElement('button');
        btn.className = 'instrument-btn';
        btn.dataset.instr = inst.id;
        btn.innerHTML = `${inst.icon} ${inst.label}`;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            _abrirInstrumento(inst.id);
        });
        row.appendChild(btn);
    });
    return row;
}

export function cargarBotonesInstrumentos() {
    const consultBtn = document.getElementById('btn-consultar-colon');
    if (!consultBtn) return;
    const parent = consultBtn.parentNode;
    const existing = document.querySelector('.instrumentos-row');
    if (existing) existing.remove();
    const row = _crearBotones();
    parent.insertBefore(row, consultBtn.nextSibling);
}

function _abrirInstrumento(id) {
    const modal = document.getElementById(`instrumento-modal`);
    const panel = modal.querySelector('.instrumento-panel');
    panel.className = 'instrumento-panel';
    panel.dataset.instr = id;
    const visual = document.getElementById('instrumento-visual');
    const info = document.getElementById('instrumento-info');
    const inst = _INSTRUMENTOS.find(i => i.id === id);
    info.innerHTML = `<h3 class="instrumento-titulo">${inst.icon} ${inst.label}</h3><p class="instrumento-desc">${inst.desc}</p>`;
    visual.innerHTML = '';
    const svg = _crearSVGInstrumento(id);
    if (svg) visual.appendChild(svg);
    modal.style.display = 'flex';
    modal.classList.add('visible');
    setTimeout(() => _iniciarInteraccion(id), 50);
}

function _cerrarInstrumento() {
    const modal = document.getElementById('instrumento-modal');
    modal.style.display = 'none';
    modal.classList.remove('visible');
    _detenerInstrumento(modal.querySelector('.instrumento-panel').dataset.instr);
}

function _detenerInstrumento(id) {
    const svg = document.querySelector(`.instr-${id}`);
    if (svg && svg._orientCleanup) { svg._orientCleanup(); svg._orientCleanup = null; }
    if (svg && svg._cleanup) { svg._cleanup(); svg._cleanup = null; }
    if (id === 'cuadrante' && _estadoCuadrante.animId) {
        cancelAnimationFrame(_estadoCuadrante.animId);
        _estadoCuadrante.animId = null;
        _estadoCuadrante.soltado = false;
        _estadoCuadrante.velocidad = 0;
        _estadoCuadrante.angulo = 0;
        _estadoCuadrante.ultimoT = null;
    }
    if (id === 'brujula') {
        _estadoBrujula.sacudidas = [];
        if (_estadoBrujula.temporizadorShake) clearTimeout(_estadoBrujula.temporizadorShake);
        _estadoBrujula.temporizadorShake = null;
        if (_estadoBrujula.shakeAnim) {
            _estadoBrujula.shakeAnim = false;
            const aguja = document.getElementById('brujula-aguja');
            if (aguja) aguja.style.transform = 'rotate(0deg)';
        }
    }
}

function _crearSVGInstrumento(id) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 80 80');
    svg.setAttribute('class', `instrumento-svg instr-${id}`);

    switch (id) {
        case 'brujula':
            svg.innerHTML = `
                <defs><radialGradient id="bg-bru-m" cx="40%" cy="35%"><stop offset="0%" stop-color="#f0ead0"/><stop offset="100%" stop-color="#c8a850"/></radialGradient></defs>
                <rect x="6" y="6" width="68" height="68" rx="12" fill="#6b3a10" stroke="#3d1f08" stroke-width="2"/>
                <rect x="9" y="9" width="62" height="62" rx="10" fill="#8b4e18" stroke="#c89010" stroke-width="1.5"/>
                <circle cx="40" cy="40" r="26" fill="url(#bg-bru-m)" stroke="#5c3a08" stroke-width="2"/>
                <circle cx="40" cy="40" r="22" fill="none" stroke="#c89010" stroke-width="1" opacity="0.5"/>
                <text x="40" y="18" text-anchor="middle" font-size="8" font-family="serif" font-weight="bold" fill="#5c3a08">N</text>
                <text x="40" y="66" text-anchor="middle" font-size="8" font-family="serif" fill="#5c3a08">S</text>
                <text x="65" y="43" text-anchor="middle" font-size="8" font-family="serif" fill="#5c3a08">E</text>
                <text x="15" y="43" text-anchor="middle" font-size="8" font-family="serif" fill="#5c3a08">O</text>
                <line x1="40" y1="20" x2="40" y2="60" stroke="#8b4e18" stroke-width="1" opacity="0.4"/>
                <line x1="20" y1="40" x2="60" y2="40" stroke="#8b4e18" stroke-width="1" opacity="0.4"/>
                <g id="brujula-aguja" style="transform-origin:40px 40px;transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1)">
                    <polygon points="40,19 36.5,40 40,37.5 43.5,40" fill="#b52020"/>
                    <polygon points="40,61 36.5,40 40,42.5 43.5,40" fill="#3d1f08"/>
                    <circle cx="40" cy="40" r="4" fill="#c89010" stroke="#3d1f08" stroke-width="1.2"/>
                    <circle cx="40" cy="40" r="1.5" fill="#f8d060"/>
                </g>
            `;
            break;
        case 'astrolabio':
            svg.innerHTML = `
                <defs><radialGradient id="bg-ast-m" cx="45%" cy="38%"><stop offset="0%" stop-color="#f5c842"/><stop offset="60%" stop-color="#c89010"/><stop offset="100%" stop-color="#8a5e08"/></radialGradient></defs>
                <circle cx="40" cy="42" r="32" fill="url(#bg-ast-m)" stroke="#5c3a08" stroke-width="2.5"/>
                <circle cx="40" cy="42" r="28" fill="none" stroke="#f8d060" stroke-width="1.2" opacity="0.5"/>
                <g stroke="#5c3a08" stroke-width="1.3">
                    <line x1="40" y1="11" x2="40" y2="16"/><line x1="40" y1="68" x2="40" y2="73"/>
                    <line x1="9" y1="42" x2="14" y2="42"/><line x1="66" y1="42" x2="71" y2="42"/>
                    <line x1="17.5" y1="19.5" x2="21.5" y2="23.5"/><line x1="58.5" y1="60.5" x2="62.5" y2="64.5"/>
                    <line x1="62.5" y1="19.5" x2="58.5" y2="23.5"/><line x1="21.5" y1="60.5" x2="17.5" y2="64.5"/>
                </g>
                <circle cx="40" cy="42" r="16" fill="#c89010" stroke="#5c3a08" stroke-width="1.5"/>
                <circle cx="40" cy="42" r="11" fill="#f5c842" stroke="#8a5e08" stroke-width="1"/>
                <g id="astrolabio-alidada" style="transform-origin:40px 42px">
                    <line x1="40" y1="12" x2="40" y2="72" stroke="#3d1f08" stroke-width="2.5" stroke-linecap="round"/>
                    <line x1="10" y1="42" x2="70" y2="42" stroke="#3d1f08" stroke-width="2.5" stroke-linecap="round"/>
                </g>
                <circle cx="40" cy="42" r="4" fill="#3d1f08"/>
                <circle cx="40" cy="42" r="1.8" fill="#f8d060"/>
                <ellipse cx="40" cy="8" rx="6" ry="4" fill="none" stroke="#5c3a08" stroke-width="2.5"/>
                <text id="astrolabio-angulo" x="40" y="76" text-anchor="middle" font-size="7" font-family="serif" fill="#f8d060" font-weight="bold">0\u00B0</text>
            `;
            break;
        case 'ballestilla':
            svg.innerHTML = `
                <rect x="4" y="37" width="72" height="6" rx="3" fill="#8b5e28" stroke="#5c3a08" stroke-width="1.5"/>
                <g stroke="#3d1f08" stroke-width="1.3">
                    <line x1="16" y1="35" x2="16" y2="39"/><line x1="28" y1="34" x2="28" y2="39"/>
                    <line x1="40" y1="33" x2="40" y2="39"/><line x1="52" y1="34" x2="52" y2="39"/>
                    <line x1="64" y1="35" x2="64" y2="39"/>
                    <line x1="16" y1="41" x2="16" y2="45"/><line x1="28" y1="41" x2="28" y2="46"/>
                    <line x1="40" y1="41" x2="40" y2="47"/><line x1="52" y1="41" x2="52" y2="46"/>
                    <line x1="64" y1="41" x2="64" y2="45"/>
                </g>
                <g id="ballestilla-cruz" style="transform-origin:38px 40px">
                    <rect x="35" y="8" width="6" height="64" rx="3" fill="#c89010" stroke="#8a5e08" stroke-width="1.5"/>
                    <circle cx="38" cy="9" r="5" fill="#f5c842" stroke="#5c3a08" stroke-width="1.5"/>
                    <circle cx="38" cy="71" r="5" fill="#f5c842" stroke="#5c3a08" stroke-width="1.5"/>
                    <circle cx="38" cy="40" r="5.5" fill="#f5c842" stroke="#5c3a08" stroke-width="1.8"/>
                    <circle cx="38" cy="40" r="2" fill="#8a5e08"/>
                </g>
                <rect x="4" y="34" width="10" height="12" rx="2" fill="#c89010" stroke="#5c3a08" stroke-width="1.5"/>
                <circle cx="9" cy="40" r="3" fill="#3d1f08"/>
                <circle cx="9" cy="40" r="1.2" fill="#f8d060"/>
                <text id="ballestilla-altura" x="72" y="20" text-anchor="end" font-size="7" font-family="serif" fill="#f8d060" font-weight="bold">45\u00B0</text>
            `;
            break;
        case 'cuadrante':
            svg.innerHTML = `
                <defs><radialGradient id="bg-cua-m" cx="20%" cy="20%"><stop offset="0%" stop-color="#f5c842"/><stop offset="100%" stop-color="#9a7008"/></radialGradient></defs>
                <path d="M 10 10 L 10 70 A 60 60 0 0 0 70 10 Z" fill="url(#bg-cua-m)" stroke="#5c3a08" stroke-width="2.5"/>
                <path d="M 14 14 L 14 66 A 52 52 0 0 0 66 14 Z" fill="none" stroke="#f8d060" stroke-width="1" opacity="0.4"/>
                <path d="M 10 62 A 52 52 0 0 0 62 10" fill="none" stroke="#3d1f08" stroke-width="1.8"/>
                <g stroke="#3d1f08" stroke-width="1.3" fill="none">
                    <line x1="10" y1="10" x2="15" y2="13"/><line x1="10" y1="10" x2="13" y2="15"/>
                    <line x1="32" y1="16" x2="31" y2="21"/><line x1="50" y1="26" x2="48" y2="30"/>
                    <line x1="61" y1="42" x2="56" y2="42"/><line x1="64" y1="30" x2="59" y2="31"/>
                </g>
                <g id="cuadrante-plomada">
                    <line x1="10" y1="10" x2="46" y2="56" stroke="#3d1f08" stroke-width="1.6" stroke-dasharray="3,3" id="cuadrante-hilo"/>
                    <circle cx="46" cy="59" r="5" fill="#c89010" stroke="#5c3a08" stroke-width="1.5"/>
                    <circle cx="46" cy="59" r="2.5" fill="#f8d060"/>
                </g>
                <circle cx="10" cy="10" r="5.5" fill="#f5c842" stroke="#5c3a08" stroke-width="1.8" pointer-events="none"/>
                <circle cx="10" cy="10" r="2.5" fill="#3d1f08" pointer-events="none"/>
                <rect x="8" y="2" width="4" height="8" rx="1.5" fill="#8b5e28" stroke="#5c3a08" stroke-width="1" pointer-events="none"/>
                <text id="cuadrante-angulo" x="40" y="76" text-anchor="middle" font-size="7" font-family="serif" fill="#f8d060" font-weight="bold">0\u00B0</text>
            `;
            break;
        default: return null;
    }
    return svg;
}

function _iniciarInteraccion(id) {
    switch (id) {
        case 'astrolabio': _iniciarAstrolabio(); break;
        case 'brujula': _iniciarBrujula(); break;
        case 'ballestilla': _iniciarBallestilla(); break;
        case 'cuadrante': _iniciarCuadrante(); break;
    }
}

function _iniciarAstrolabio() {
    _estadoAstrolabio.arrastrando = false;
    const svg = document.querySelector('.instr-astrolabio');
    if (!svg) return;
    const alidada = document.getElementById('astrolabio-alidada');
    const anguloEl = document.getElementById('astrolabio-angulo');
    let angulo = 0;

    function actualizarAngulo(clientX, clientY) {
        const rect = svg.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height * (42 / 80);
        const dx = clientX - cx;
        const dy = clientY - cy;
        angulo = Math.round(Math.atan2(dy, dx) * 180 / Math.PI);
        if (angulo < 0) angulo += 360;
        if (alidada) alidada.style.transform = `rotate(${angulo}deg)`;
        if (anguloEl) anguloEl.textContent = `${angulo}\u00B0`;
    }

    const onStart = e => {
        _estadoAstrolabio.arrastrando = true;
        const p = e.touches ? e.touches[0] : e;
        actualizarAngulo(p.clientX, p.clientY);
    };
    const onMove = e => {
        if (!_estadoAstrolabio.arrastrando) return;
        e.preventDefault();
        const p = e.touches ? e.touches[0] : e;
        actualizarAngulo(p.clientX, p.clientY);
    };
    const onEnd = () => { _estadoAstrolabio.arrastrando = false; };

    svg.addEventListener('pointerdown', onStart);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onEnd);
    svg.addEventListener('pointerleave', onEnd);
    svg._cleanup = () => {
        svg.removeEventListener('pointerdown', onStart);
        svg.removeEventListener('pointermove', onMove);
        svg.removeEventListener('pointerup', onEnd);
        svg.removeEventListener('pointerleave', onEnd);
    };
}

function _iniciarBrujula() {
    const aguja = document.getElementById('brujula-aguja');
    if (!aguja) return;
    aguja.style.transform = 'rotate(0deg)';
    _estadoBrujula.sacudidas = [];
    if (_estadoBrujula.temporizadorShake) clearTimeout(_estadoBrujula.temporizadorShake);

    const onPointerDown = () => {
        _estadoBrujula.sacudidas.push(Date.now());
        const recientes = _estadoBrujula.sacudidas.filter(t => Date.now() - t < 1200);
        _estadoBrujula.sacudidas = recientes;
        if (_estadoBrujula.shakeAnim) return;
        if (recientes.length >= 3) {
            _estadoBrujula.shakeAnim = true;
            aguja.style.transition = 'none';
            aguja.style.transform = 'rotate(0deg)';
            void aguja.offsetWidth;
            const sacudir = (veces) => {
                if (veces <= 0) {
                    aguja.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
                    aguja.style.transform = 'rotate(0deg)';
                    setTimeout(() => { _estadoBrujula.shakeAnim = false; }, 700);
                    return;
                }
                const angulo = (Math.random() - 0.5) * 40;
                aguja.style.transition = 'none';
                aguja.style.transform = `rotate(${angulo}deg)`;
                void aguja.offsetWidth;
                requestAnimationFrame(() => {
                    aguja.style.transition = 'transform 0.08s ease';
                    aguja.style.transform = `rotate(${angulo * -0.6}deg)`;
                    setTimeout(() => sacudir(veces - 1), 80);
                });
            };
            sacudir(6);
        } else {
            const wobble = (Math.random() - 0.5) * 12;
            aguja.style.transition = 'transform 0.15s ease';
            aguja.style.transform = `rotate(${wobble}deg)`;
            if (_estadoBrujula.temporizadorShake) clearTimeout(_estadoBrujula.temporizadorShake);
            _estadoBrujula.temporizadorShake = setTimeout(() => {
                aguja.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
                aguja.style.transform = 'rotate(0deg)';
            }, 300);
        }
    };

    const svg = document.querySelector('.instr-brujula');
    if (svg) {
        svg.addEventListener('pointerdown', onPointerDown);
        svg._cleanup = () => { svg.removeEventListener('pointerdown', onPointerDown); };
    }

    const orientHandler = e => {
        if (!aguja) return;
        let heading = null;
        if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
            heading = e.webkitCompassHeading;
        } else if (e.alpha !== null) {
            heading = e.alpha;
        }
        if (heading !== null) {
            aguja.style.transition = 'transform 0.3s ease-out';
            aguja.style.transform = `rotate(${-heading}deg)`;
        }
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') {
                window.addEventListener('deviceorientation', orientHandler);
                if (svg) svg._orientCleanup = () => window.removeEventListener('deviceorientation', orientHandler);
            }
        }).catch(() => {});
    } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', orientHandler);
        if (svg) svg._orientCleanup = () => window.removeEventListener('deviceorientation', orientHandler);
    }
}

function _iniciarBallestilla() {
    _estadoBallestilla.arrastrando = false;
    _estadoBallestilla.offsetY = 0;
    const cruz = document.getElementById('ballestilla-cruz');
    const alturaEl = document.getElementById('ballestilla-altura');
    if (!cruz) return;
    const svg = document.querySelector('.instr-ballestilla');
    if (!svg) return;
    cruz.style.transform = 'translateY(0px)';
    if (alturaEl) alturaEl.textContent = '45\u00B0';
    const limits = { min: -28, max: 28 };

    function actualizar(clientY) {
        const rect = svg.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const delta = clientY - centerY;
        let y = Math.max(limits.min, Math.min(limits.max, delta));
        _estadoBallestilla.offsetY = y;
        cruz.style.transform = `translateY(${y}px)`;
        if (alturaEl) {
            const grados = Math.round(45 + (y / limits.max) * -40);
            alturaEl.textContent = `${Math.max(5, Math.min(85, grados))}\u00B0`;
        }
    }

    const onStart = e => {
        _estadoBallestilla.arrastrando = true;
        const p = e.touches ? e.touches[0] : e;
        actualizar(p.clientY);
    };
    const onMove = e => {
        if (!_estadoBallestilla.arrastrando) return;
        e.preventDefault();
        const p = e.touches ? e.touches[0] : e;
        actualizar(p.clientY);
    };
    const onEnd = () => { _estadoBallestilla.arrastrando = false; };

    cruz.style.touchAction = 'none';
    cruz.addEventListener('pointerdown', onStart);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onEnd);
    svg.addEventListener('pointerleave', onEnd);
    svg._cleanup = () => {
        cruz.removeEventListener('pointerdown', onStart);
        svg.removeEventListener('pointermove', onMove);
        svg.removeEventListener('pointerup', onEnd);
        svg.removeEventListener('pointerleave', onEnd);
    };
}

function _iniciarCuadrante() {
    _estadoCuadrante.angulo = 0;
    _estadoCuadrante.velocidad = 0;
    _estadoCuadrante.soltado = false;
    _estadoCuadrante.ultimoT = null;
    const cristal = document.getElementById('cuadrante-plomada');
    const anguloEl = document.getElementById('cuadrante-angulo');
    if (!cristal) return;
    const grados = document.getElementById('cuadrante-hilo');
    if (anguloEl) anguloEl.textContent = '0\u00B0';

    function animar(timestamp) {
        if (_estadoCuadrante.ultimoT === null) _estadoCuadrante.ultimoT = timestamp;
        const dt = Math.min((timestamp - _estadoCuadrante.ultimoT) / 1000, 0.05);
        _estadoCuadrante.ultimoT = timestamp;

        if (_estadoCuadrante.soltado) {
            _estadoCuadrante.velocidad += 120 * dt;
            _estadoCuadrante.angulo += _estadoCuadrante.velocidad * dt * 3;
            _estadoCuadrante.velocidad *= Math.pow(0.97, dt * 60);
            if (Math.abs(_estadoCuadrante.velocidad) < 0.5) {
                _estadoCuadrante.velocidad = 0;
                if (_estadoCuadrante.angulo <= 5) {
                    _estadoCuadrante.soltado = false;
                }
            }
        }
        _estadoCuadrante.angulo = Math.max(0, Math.min(80, _estadoCuadrante.angulo));
        const rad = (_estadoCuadrante.angulo + 10) * Math.PI / 180;
        const len = 46;
        const cx = 10, cy = 10;
        const x2 = cx + len * Math.cos(rad);
        const y2 = cy + len * Math.sin(rad);
        if (grados) {
            grados.setAttribute('x2', x2);
            grados.setAttribute('y2', y2);
        }
        const peso = document.querySelector('#cuadrante-plomada circle');
        if (peso) { peso.setAttribute('cx', x2); peso.setAttribute('cy', y2 + 3); }
        if (anguloEl) anguloEl.textContent = `${Math.round(_estadoCuadrante.angulo)}\u00B0`;
        _estadoCuadrante.animId = requestAnimationFrame(animar);
    }

    const onPointerDown = e => {
        if (_estadoCuadrante.soltado) return;
        _estadoCuadrante.soltado = true;
        _estadoCuadrante.velocidad = -12 + Math.random() * 8;
        _estadoCuadrante.angulo = Math.random() * 10;
        _estadoCuadrante.ultimoT = null;
    };

    if (_estadoCuadrante.animId) cancelAnimationFrame(_estadoCuadrante.animId);
    _estadoCuadrante.ultimoT = null;
    _estadoCuadrante.animId = requestAnimationFrame(animar);

    cristal.style.cursor = 'pointer';
    cristal.addEventListener('pointerdown', onPointerDown);
    const svg = document.querySelector('.instr-cuadrante');
    if (svg) svg._cleanup = () => { cristal.removeEventListener('pointerdown', onPointerDown); };
}

export function initInstrumentos() {
    const modal = document.getElementById('instrumento-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.instrumento-close');
    if (closeBtn) closeBtn.addEventListener('click', _cerrarInstrumento);
    modal.addEventListener('click', e => {
        if (e.target === modal) _cerrarInstrumento();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.style.display === 'flex') _cerrarInstrumento();
    });
}
