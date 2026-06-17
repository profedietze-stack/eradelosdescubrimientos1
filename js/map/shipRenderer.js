import { _mapState } from './mapState.js';
import { interpolarRuta, progresoARutaIdx, calcularAnguloFlota } from '../utils.js';
import { gameState } from '../gameState.js';

function drawCaravel(ctx, x, y, scale, angle, shipNum, flipX) {
    flipX = flipX || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale * flipX, scale);
    ctx.save();
    ctx.translate(0, 9); ctx.scale(1, 0.2);
    ctx.beginPath(); ctx.ellipse(0,0,26,8,0,0,Math.PI*2);
    ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-24,  2);
    ctx.lineTo(-24,  9);
    ctx.quadraticCurveTo(-18,13,-5,13);
    ctx.quadraticCurveTo( 10,13,22, 8);
    ctx.lineTo(27,  2);
    ctx.quadraticCurveTo(26,-1,22,-2);
    ctx.lineTo(-24, 2);
    ctx.closePath();
    ctx.fillStyle = "#5a2e0a"; ctx.fill();
    ctx.strokeStyle = "#2a1205"; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-23,4); ctx.quadraticCurveTo(0,2,24,3);
    ctx.strokeStyle = "#c89010"; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(27,1); ctx.lineTo(37,-2); ctx.lineTo(27,3);
    ctx.fillStyle = "#7a3a10"; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-24,2); ctx.lineTo(-24,-9); ctx.lineTo(-13,-11); ctx.lineTo(-13,2);
    ctx.closePath();
    ctx.fillStyle = "#6b3010"; ctx.fill();
    ctx.strokeStyle = "#2a1205"; ctx.lineWidth=0.6; ctx.stroke();
    ctx.beginPath(); ctx.arc(-19,-4,1.8,0,Math.PI*2);
    ctx.fillStyle="#e8d090"; ctx.fill();
    ctx.strokeStyle="#8b4513"; ctx.lineWidth=0.5; ctx.stroke();
    ctx.strokeStyle="#3a1a05";
    ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(4,2); ctx.lineTo(4,-37); ctx.stroke();
    ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(16,0); ctx.lineTo(15,-25); ctx.stroke();
    ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(-16,-2); ctx.lineTo(-15,-18); ctx.stroke();
    ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(27,1); ctx.lineTo(20,-11); ctx.stroke();
    ctx.strokeStyle="#3a1a05";
    ctx.lineWidth=1;   ctx.beginPath(); ctx.moveTo(-13,-33); ctx.lineTo(19,-33); ctx.stroke();
    ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(-4,-19);  ctx.lineTo(18,-19); ctx.stroke();
    ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(5,-21);   ctx.lineTo(25,-21); ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-12,-32); ctx.lineTo(18,-32);
    ctx.quadraticCurveTo(21,-25,17,-20); ctx.lineTo(-3,-20);
    ctx.quadraticCurveTo(-7,-25,-12,-32); ctx.closePath();
    ctx.fillStyle="#f0ebe0"; ctx.fill();
    ctx.strokeStyle="#c8a040"; ctx.lineWidth=0.5; ctx.stroke();
    ctx.fillStyle="#b52020";
    ctx.fillRect(1,-31,3,10); ctx.fillRect(-3,-25.5,12,2.5);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-3,-18); ctx.lineTo(17,-18);
    ctx.quadraticCurveTo(18,-13,16,-10); ctx.lineTo(-1,-10);
    ctx.quadraticCurveTo(-3,-14,-3,-18); ctx.closePath();
    ctx.fillStyle="#e8e2d0"; ctx.fill();
    ctx.strokeStyle="#c8a040"; ctx.lineWidth=0.4; ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(6,-20); ctx.lineTo(24,-20);
    ctx.quadraticCurveTo(25,-15,23,-12); ctx.lineTo(7,-12);
    ctx.quadraticCurveTo(5,-16,6,-20); ctx.closePath();
    ctx.fillStyle="#ece7d5"; ctx.fill();
    ctx.strokeStyle="#c8a040"; ctx.lineWidth=0.4; ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-15,-4); ctx.lineTo(-7,-4); ctx.lineTo(-15,-17);
    ctx.closePath(); ctx.fillStyle="#e8e2d0"; ctx.fill();
    ctx.strokeStyle="#c8a040"; ctx.lineWidth=0.4; ctx.stroke();
    ctx.restore();
    ctx.strokeStyle="rgba(80,40,10,0.45)"; ctx.lineWidth=0.4;
    [[4,-37,20,2],[4,-37,-16,2],[15,-25,25,0],[4,-37,20,-19],[4,-37,-4,-19]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });
    ctx.save(); ctx.translate(4,-37);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(9,-2); ctx.lineTo(9,-5); ctx.lineTo(0,-3); ctx.closePath();
    ctx.fillStyle = shipNum===0 ? "#c82010" : "#e8c030"; ctx.fill();
    ctx.restore();
    const nombres=["S.Ma","Pinta","Nina"];
    ctx.font="bold 5px Cinzel,serif"; ctx.textAlign="center";
    ctx.fillStyle="#f5d060"; ctx.strokeStyle="rgba(0,0,0,0.8)"; ctx.lineWidth=1.6;
    ctx.strokeText(nombres[shipNum],0,21); ctx.fillText(nombres[shipNum],0,21);
    ctx.restore();
}

function _drawFormacion(ctx, sx, sy, baseScale, angle) {
    const goingLeft = angle > Math.PI / 4 || angle < -Math.PI * 3/4;
    const flipX = goingLeft ? 1 : -1;
    const offsets = [
        { dx:  0,   dy:  0,   s: 1.15, n: 0 },
        { dx: -28,  dy: -14,  s: 0.82, n: 1 },
        { dx: -26,  dy:  14,  s: 0.76, n: 2 },
    ];
    offsets.forEach(o => {
        const ex = sx + (o.dx * flipX) * Math.cos(angle) - o.dy * Math.sin(angle);
        const ey = sy + (o.dx * flipX) * Math.sin(angle) + o.dy * Math.cos(angle);
        drawCaravel(ctx, ex, ey, baseScale * o.s, angle, o.n, flipX);
    });
}

function renderShipsAt(progress) {
    if (!_mapState.canvasCtx || !_mapState.canvas || !_mapState.projection) return;
    if (progress === null || progress === undefined) return;
    const W = _mapState.canvas.width, H = _mapState.canvas.height;
    _mapState.canvasCtx.clearRect(0, 0, W, H);
    const transform  = window.d3.zoomTransform(document.getElementById('map-svg'));
    const idx        = progresoARutaIdx(progress);
    const [lon, lat] = interpolarRuta(idx);
    const [bx, by]   = _mapState.projection([lon, lat]);
    const sx = transform.applyX(bx);
    const sy = transform.applyY(by);
    const angle      = calcularAnguloFlota(idx, _mapState.projection);
    const baseScale  = Math.min(W, H) / 300;
    _drawFormacion(_mapState.canvasCtx, sx, sy, baseScale, angle);
}

function renderShipsAtIdx(idx) {
    if (!_mapState.canvasCtx || !_mapState.canvas || !_mapState.projection) return;
    const W = _mapState.canvas.width, H = _mapState.canvas.height;
    _mapState.canvasCtx.clearRect(0, 0, W, H);
    const transform  = window.d3.zoomTransform(document.getElementById('map-svg'));
    const [lon, lat] = interpolarRuta(idx);
    const [bx, by]   = _mapState.projection([lon, lat]);
    const sx = transform.applyX(bx);
    const sy = transform.applyY(by);
    const angle      = calcularAnguloFlota(idx, _mapState.projection);
    const baseScale  = Math.min(W, H) / 300;
    _drawFormacion(_mapState.canvasCtx, sx, sy, baseScale, angle);
}

function renderShipsAtOffset(progress, dyOffset) {
    if (!_mapState.canvasCtx || !_mapState.canvas || !_mapState.projection) return;
    const W = _mapState.canvas.width, H = _mapState.canvas.height;
    _mapState.canvasCtx.clearRect(0, 0, W, H);
    const transform   = window.d3.zoomTransform(document.getElementById('map-svg'));
    const idx         = progresoARutaIdx(progress);
    const [lon, lat]  = interpolarRuta(idx);
    const [bx, by]    = _mapState.projection([lon, lat]);
    const sx = transform.applyX(bx);
    const sy = transform.applyY(by) + (dyOffset || 0);
    const angle       = calcularAnguloFlota(idx, _mapState.projection);
    const baseScale   = Math.min(W, H) / 300;
    _drawFormacion(_mapState.canvasCtx, sx, sy, baseScale, angle);
}

function startBobbing() {
    if (_mapState.bobbingActive) return;
    _mapState.bobbingActive = true;
    function bob(t) {
        if (!_mapState.ready || _mapState.anim.active || gameState._pendingContinuar) { _mapState.bobbingActive = false; return; }
        const dy = Math.sin(t * 0.0012) * 1.8;
        renderShipsAtOffset(gameState.progress, dy);
        _mapState.bobbingRaf = requestAnimationFrame(bob);
    }
    _mapState.bobbingRaf = requestAnimationFrame(bob);
}

function stopBobbing() {
    _mapState.bobbingActive = false;
    if (_mapState.bobbingRaf) { cancelAnimationFrame(_mapState.bobbingRaf); _mapState.bobbingRaf = null; }
}

function moverBarco() {
    if (!_mapState.ready || _mapState.anim.active || gameState._pendingContinuar) return;
    renderShipsAt(gameState.progress);
}

export { drawCaravel, _drawFormacion, renderShipsAt, renderShipsAtIdx, renderShipsAtOffset, startBobbing, stopBobbing, moverBarco };
