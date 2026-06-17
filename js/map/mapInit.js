import { _mapState } from './mapState.js';
import { RUTA_COLON, MAP_COLORS } from '../../data/rutas.js';
import { WORLD_ATLAS_DATA } from '../../data/worldAtlas.js';
import { progresoARutaIdx, interpolarRuta } from '../utils.js';
import { renderShipsAt, startBobbing } from './shipRenderer.js';
import { gameState } from '../gameState.js';

async function initMap() {
    if (typeof window.d3 === 'undefined' || typeof window.topojson === 'undefined') {
        console.warn('initMap: d3 o topojson no disponibles (sin conexión). Mapa deshabilitado.');
        const container = document.getElementById('map-container');
        if (container) {
            container.style.background = 'linear-gradient(160deg,#0d2d4f 0%,#1a3d5f 100%)';
            container.innerHTML = `
                <svg id="map-svg" style="width:100%;height:100%;position:absolute;inset:0;"></svg>
                <canvas id="ship-canvas" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;"></canvas>
                <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;pointer-events:none;">
                    <div style="font-size:2.5rem;opacity:0.6;">🗺️</div>
                    <div style="font-family:var(--font-header);font-size:clamp(0.72rem,1.5vw,0.88rem);color:rgba(245,224,168,0.7);letter-spacing:0.08em;text-align:center;max-width:240px;line-height:1.5;">
                        Mapa no disponible sin conexión a internet.<br>El juego continúa normalmente.
                    </div>
                </div>
                <div class="fleet-indicator" id="fleet-indicator">⛵ Santa María · Pinta · Niña</div>
                <div class="progress-badge" id="progress-badge">Progreso: <span id="progreso-text">0%</span></div>
                <div class="map-zoom-controls">
                    <button class="map-zoom-btn" onclick="mapZoom(1.4)" title="Acercar">+</button>
                    <button class="map-zoom-btn" onclick="mapZoom(0.7)" title="Alejar">−</button>
                    <button class="map-zoom-btn" onclick="mapReset()" title="Centrar">⌂</button>
                </div>`;
        }
        return;
    }
    const container = document.getElementById('map-container');
    const svg       = document.getElementById('map-svg');
    const canvas    = document.getElementById('ship-canvas');
    if (!svg || !canvas || !container) return;

    const W = container.offsetWidth  || 600;
    const H = container.offsetHeight || 280;

    canvas.width  = W;
    canvas.height = H;
    _mapState.canvas  = canvas;
    _mapState.canvasCtx = canvas.getContext('2d');

    _mapState.projection = window.d3.geoMercator()
        .center([-40, 28])
        .scale(W * 1.05)
        .translate([W / 2, H / 2]);

    _mapState.path = window.d3.geoPath().projection(_mapState.projection);

    _mapState.lineGen = window.d3.line()
        .x(d => _mapState.projection(d)[0])
        .y(d => _mapState.projection(d)[1])
        .curve(window.d3.curveCatmullRom.alpha(0.5));

    _mapState.svg = window.d3.select(svg)
        .attr('width',   W)
        .attr('height',  H)
        .attr('viewBox', `0 0 ${W} ${H}`);

    const defs = _mapState.svg.append('defs');

    const og = defs.append('linearGradient').attr('id','oceanGrad')
        .attr('x1','0%').attr('y1','0%').attr('x2','0%').attr('y2','100%');
    og.append('stop').attr('offset','0%' ).attr('stop-color','#1e4a7a');
    og.append('stop').attr('offset','100%').attr('stop-color','#0d2d50');

    const lg = defs.append('linearGradient').attr('id','landGrad')
        .attr('x1','0%').attr('y1','0%').attr('x2','0%').attr('y2','100%');
    lg.append('stop').attr('offset','0%' ).attr('stop-color','#d4b878');
    lg.append('stop').attr('offset','100%').attr('stop-color','#b89050');

    const fl = defs.append('filter').attr('id','routeGlow')
        .attr('x','-60%').attr('y','-60%').attr('width','220%').attr('height','220%');
    fl.append('feGaussianBlur').attr('in','SourceGraphic').attr('stdDeviation','4').attr('result','blur');
    fl.append('feComposite').attr('in','SourceGraphic').attr('in2','blur').attr('operator','over');

    const hp = defs.append('pattern').attr('id','hatch')
        .attr('width',4).attr('height',4)
        .attr('patternUnits','userSpaceOnUse')
        .attr('patternTransform','rotate(45)');
    hp.append('line').attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',4)
        .attr('stroke','rgba(100,60,10,0.10)').attr('stroke-width',1.5);

    _mapState.svg.append('rect').attr('width',W).attr('height',H).attr('fill','url(#oceanGrad)');
    _mapState.g = _mapState.svg.append('g').attr('class','map-main-g');

    const graticule = window.d3.geoGraticule().step([10, 10]);
    _mapState.g.append('path').datum(graticule())
        .attr('d', _mapState.path).attr('fill','none')
        .attr('stroke', MAP_COLORS.gridLine).attr('stroke-width', 0.5);

    try {
        const world = WORLD_ATLAS_DATA;
        const countries = window.topojson.feature(world, world.objects.countries);
        _mapState.g.append('g').selectAll('path').data(countries.features).join('path')
            .attr('d', _mapState.path).attr('fill','url(#landGrad)')
            .attr('stroke', MAP_COLORS.landBorder).attr('stroke-width', 0.5)
            .attr('stroke-linejoin','round');
        _mapState.g.append('g').selectAll('path').data(countries.features).join('path')
            .attr('d', _mapState.path).attr('fill','url(#hatch)').attr('stroke','none');
    } catch(e) {
        [
            'M160,25 L290,25 L300,125 L240,135 L160,100 Z',
            'M150,125 L265,125 L275,245 L195,265 L145,205 Z',
            'M15,55 L95,55 L105,205 L25,215 Z',
        ].forEach(d => _mapState.g.append('path').attr('d',d)
            .attr('fill','url(#landGrad)').attr('stroke',MAP_COLORS.landBorder).attr('stroke-width',1));
    }

    _mapState.g.append('path').datum(RUTA_COLON)
        .attr('d', _mapState.lineGen).attr('fill','none')
        .attr('stroke','rgba(255,255,255,0.12)')
        .attr('stroke-width', 2).attr('stroke-dasharray','4,6');

    _mapState.g.append('path').attr('id','trail-glow')
        .attr('fill','none')
        .attr('stroke', MAP_COLORS.trailGlow)
        .attr('stroke-width', 9).attr('stroke-linecap','round')
        .attr('filter','url(#routeGlow)');

    _mapState.trailPath = _mapState.g.append('path').attr('id','trail-recorrido')
        .attr('fill','none')
        .attr('stroke', MAP_COLORS.trailColor)
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray','7,4')
        .attr('stroke-linecap','round');

    const puertos = [
        { lon: -6.55, lat: 37.23, label: 'Palos',        side: 'right' },
        { lon: -13.5, lat: 28.1,  label: 'Canarias',     side: 'right' },
        { lon: -74.5, lat: 24.0,  label: 'San Salvador', side: 'left'  },
        { lon: -69.5, lat: 18.0,  label: 'La Española',  side: 'left'  },
    ];
    const pg = _mapState.g.append('g').attr('class','ports');
    puertos.forEach(p => {
        const [px, py] = _mapState.projection([p.lon, p.lat]);
        pg.append('circle').attr('cx',px).attr('cy',py).attr('r',6)
            .attr('fill','rgba(200,50,10,0.25)').attr('stroke','none');
        pg.append('circle').attr('cx',px).attr('cy',py).attr('r',2.8)
            .attr('fill', MAP_COLORS.portDot)
            .attr('stroke', MAP_COLORS.portBorder).attr('stroke-width',1);
        const xOff = p.side === 'right' ? 8 : -8;
        pg.append('text')
            .attr('x', px + xOff).attr('y', py + 1)
            .attr('text-anchor', p.side === 'right' ? 'start' : 'end')
            .attr('font-size', 7.5).attr('font-family',"'Palatino Linotype', 'Book Antiqua', Palatino, Georgia,serif")
            .attr('fill', MAP_COLORS.labelColor)
            .attr('paint-order','stroke')
            .attr('stroke','rgba(0,0,0,0.75)').attr('stroke-width', 2.5)
            .text(p.label);
    });

    const zonasLabel = [
        { lon: -38, lat: 32,  label: 'Mar Océano',         fs: 7   },
        { lon: -48, lat: 21,  label: 'Sargazos',           fs: 6.5 },
        { lon: -13, lat: 24,  label: 'Atlántico',          fs: 6.5 },
        { lon: -36, lat: 15,  label: 'Trópico de Cáncer',  fs: 5.5 },
    ];
    const zlg = _mapState.g.append('g').attr('class','zone-labels');
    zonasLabel.forEach(z => {
        const [zx, zy] = _mapState.projection([z.lon, z.lat]);
        zlg.append('text')
            .attr('x', zx).attr('y', zy)
            .attr('text-anchor','middle')
            .attr('font-size', z.fs)
            .attr('font-family',"Georgia, 'Times New Roman',serif")
            .attr('font-style','italic')
            .attr('fill','rgba(200,220,255,0.28)')
            .attr('letter-spacing','1.5')
            .text(z.label);
    });

    drawCompassRoseD3(W);

    _mapState.zoom = window.d3.zoom()
        .scaleExtent([0.5, 10])
        .on('zoom', (event) => {
            _mapState.g.attr('transform', event.transform);
            if (!_mapState.anim.active && !gameState._pendingContinuar) renderShipsAt(gameState.progress);
        });
    window.d3.select(svg).call(_mapState.zoom);

    container.addEventListener('touchmove', e => {
        if (e.touches.length > 1) e.preventDefault();
    }, { passive: false });

    _mapState.ready = true;
    updateTrail(gameState.progress);
    renderShipsAt(gameState.progress);

    zoomToFleet(gameState.progress, false);
    setTimeout(startBobbing, 600);
}

function updateTrail(progress) {
    if (!_mapState.trailPath || !_mapState.lineGen) return;
    const idx = progresoARutaIdx(progress);
    const i   = Math.floor(idx);
    const t   = idx - i;
    const pts = RUTA_COLON.slice(0, i + 1);
    if (i < RUTA_COLON.length - 1) {
        const p0 = RUTA_COLON[i], p1 = RUTA_COLON[i + 1];
        pts.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]);
    }
    const d = pts.length > 1 ? _mapState.lineGen(pts) : '';
    _mapState.trailPath.attr('d', d);
    window.d3.select('#trail-glow').attr('d', d);
}

function updateTrailAt(idx) {
    if (!_mapState.trailPath || !_mapState.lineGen) return;
    const i   = Math.floor(idx);
    const t   = idx - i;
    const pts = RUTA_COLON.slice(0, Math.min(i + 1, RUTA_COLON.length));
    if (i < RUTA_COLON.length - 1) {
        const p0 = RUTA_COLON[i], p1 = RUTA_COLON[Math.min(i+1,RUTA_COLON.length-1)];
        pts.push([p0[0] + (p1[0]-p0[0])*t, p0[1]+(p1[1]-p0[1])*t]);
    }
    const d = pts.length > 1 ? _mapState.lineGen(pts) : '';
    _mapState.trailPath.attr('d', d);
    window.d3.select('#trail-glow').attr('d', d);
}

function drawCompassRoseD3(W) {
    const rx = W - 46, ry = 46;
    const rg = _mapState.g.append('g').attr('transform',`translate(${rx},${ry})`);
    [[0,-22,1],[0,22,0],[22,0,1],[-22,0,0]].forEach(([tx,ty,bright],i) => {
        const fill = bright ? '#f5d060' : '#c8a040';
        const pts = i%2===0
            ? `0,0 4,${ty*0.4} ${tx},${ty} -4,${ty*0.4}`
            : `0,0 ${tx*0.4},4 ${tx},${ty} ${tx*0.4},-4`;
        rg.append('polygon').attr('points',pts)
            .attr('fill',fill).attr('stroke','#8b4513').attr('stroke-width',0.5);
    });
    [[12,-12],[12,12],[-12,12],[-12,-12]].forEach(([tx,ty]) => {
        rg.append('polygon')
            .attr('points',`0,0 3,${ty*0.5} ${tx},${ty} ${tx*0.5},3`)
            .attr('fill','#d4a840').attr('stroke','#8b4513').attr('stroke-width',0.4);
    });
    rg.append('circle').attr('r',4).attr('fill','#f5d060').attr('stroke','#8b4513').attr('stroke-width',1);
    rg.append('circle').attr('r',1.5).attr('fill','#8b4513');
    rg.append('text').attr('x',0).attr('y',-28).attr('text-anchor','middle')
        .attr('font-size',9).attr('font-family',"'Palatino Linotype', 'Book Antiqua', Palatino, Georgia,serif").attr('font-weight','bold')
        .attr('fill','#f5d060').attr('stroke','rgba(0,0,0,0.7)').attr('stroke-width',1.5)
        .attr('paint-order','stroke').text('N');
}

function zoomToFleet(progress, animate) {
    if (!_mapState.svg || !_mapState.projection || !_mapState.zoom) return;
    const idx        = progresoARutaIdx(progress);
    const [lon, lat] = interpolarRuta(idx);
    const [bx, by]   = _mapState.projection([lon, lat]);
    const W          = parseInt(_mapState.svg.attr('width'));
    const H          = parseInt(_mapState.svg.attr('height'));
    const zoomLevel  = 2.8;
    const tx = W / 2 - zoomLevel * bx;
    const ty = H / 2 - zoomLevel * by;
    const transform  = window.d3.zoomIdentity.translate(tx, ty).scale(zoomLevel);
    const sel = window.d3.select(document.getElementById('map-svg'));
    if (animate) {
        sel.transition().duration(1600).ease(window.d3.easeCubicInOut)
           .call(_mapState.zoom.transform, transform);
    } else {
        sel.call(_mapState.zoom.transform, transform);
    }
}

function mapZoom(factor) {
    if (!_mapState.svg) return;
    window.d3.select(document.getElementById('map-svg'))
        .transition().duration(280).call(_mapState.zoom.scaleBy, factor);
}

function mapReset() {
    if (!_mapState.svg || !_mapState.projection || !_mapState.zoom) return;
    zoomToFleet(gameState.progress, true);
}

let _resizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
        const container = document.getElementById('map-container');
        const canvas    = document.getElementById('ship-canvas');
        const svg       = document.getElementById('map-svg');
        if (!container || !canvas || !svg || !_mapState.ready) return;
        const W = container.offsetWidth, H = container.offsetHeight;
        canvas.width = W; canvas.height = H;
        _mapState.svg.attr('width',W).attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);
        _mapState.projection.translate([W/2, H/2]).scale(W * 1.05);
        _mapState.path = window.d3.geoPath().projection(_mapState.projection);
        _mapState.ready = false;
        _mapState.g && _mapState.g.remove();
        _mapState.svg.selectAll('rect:first-child').remove();
        initMap();
    }, 150);
});

export { initMap, updateTrail, updateTrailAt, drawCompassRoseD3, zoomToFleet, mapZoom, mapReset };
