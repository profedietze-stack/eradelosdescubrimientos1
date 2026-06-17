const _AudioCtxClass = window.AudioContext || window.webkitAudioContext;
let _audioCtx = null;
let _masterGain = null;
let _ambientNodes = [];
let _audioEnabled = true;
let _audioInitialized = false;

function _initAudio() {
    if (_audioInitialized || !_AudioCtxClass) return;
    try {
        _audioCtx = new _AudioCtxClass();
        _masterGain = _audioCtx.createGain();
        _masterGain.gain.setValueAtTime(0.5, _audioCtx.currentTime);
        _masterGain.connect(_audioCtx.destination);
        _audioInitialized = true;
        _startOleaje();
    } catch(e) { _audioEnabled = false; }
}

function _resumeAudio() {
    if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume().catch(()=>{});
}

function _startOleaje() {
    if (!_audioCtx || !_audioEnabled) return;
    const sr = _audioCtx.sampleRate;
    const bufLen = sr * 4;
    const buf = _audioCtx.createBuffer(1, bufLen, sr);
    const data = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i=0;i<bufLen;i++) {
        const w=Math.random()*2-1;
        b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
        b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
        b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
        data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926;
    }
    const src=_audioCtx.createBufferSource(); src.buffer=buf; src.loop=true;
    const lpf=_audioCtx.createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=400; lpf.Q.value=0.7;
    const lfo=_audioCtx.createOscillator(); lfo.frequency.value=0.07;
    const lfoG=_audioCtx.createGain(); lfoG.gain.value=160;
    lfo.connect(lfoG); lfoG.connect(lpf.frequency);
    const ambG=_audioCtx.createGain();
    ambG.gain.setValueAtTime(0,_audioCtx.currentTime);
    ambG.gain.linearRampToValueAtTime(0.32,_audioCtx.currentTime+4);
    src.connect(lpf); lpf.connect(ambG); ambG.connect(_masterGain);
    src.start(); lfo.start();
    _ambientNodes=[src,lfo];
}

function _stopOleaje() {
    _ambientNodes.forEach(n=>{try{n.stop();}catch(e){}});
    _ambientNodes=[];
}

function _sfxDecision(positivo) {
    if (!_audioCtx||!_audioEnabled) return; _resumeAudio();
    const t=_audioCtx.currentTime;
    const notas = positivo ? [[220,0],[277.2,0.06],[330,0.12]] : [[196,0],[233.1,0.05],[277.2,0.1]];
    notas.forEach(([freq,delay])=>{
        const osc=_audioCtx.createOscillator(); const g=_audioCtx.createGain();
        osc.type=positivo?'sine':'triangle'; osc.frequency.value=freq;
        g.gain.setValueAtTime(0,t+delay); g.gain.linearRampToValueAtTime(positivo?0.1:0.07,t+delay+0.05);
        g.gain.exponentialRampToValueAtTime(0.001,t+delay+(positivo?1.1:0.85));
        osc.connect(g); g.connect(_masterGain); osc.start(t+delay); osc.stop(t+delay+1.3);
    });
    if (!positivo) {
        const bl=Math.floor(_audioCtx.sampleRate*0.12); const bb=_audioCtx.createBuffer(1,bl,_audioCtx.sampleRate);
        const dd=bb.getChannelData(0); for(let i=0;i<bl;i++) dd[i]=(Math.random()*2-1)*Math.pow(1-i/bl,2)*0.45;
        const ss=_audioCtx.createBufferSource(); ss.buffer=bb;
        const gg=_audioCtx.createGain(); gg.gain.value=0.15;
        ss.connect(gg); gg.connect(_masterGain); ss.start(t+0.02);
    }
}

function _sfxMoverBarco() {
    if (!_audioCtx||!_audioEnabled) return; _resumeAudio();
    const t=_audioCtx.currentTime;
    const bl=Math.floor(_audioCtx.sampleRate*0.25); const buf=_audioCtx.createBuffer(1,bl,_audioCtx.sampleRate);
    const d=buf.getChannelData(0); for(let i=0;i<bl;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/bl,1.5)*0.55;
    const src=_audioCtx.createBufferSource(); src.buffer=buf;
    const bpf=_audioCtx.createBiquadFilter(); bpf.type='bandpass'; bpf.frequency.value=350; bpf.Q.value=7;
    const g=_audioCtx.createGain(); g.gain.value=0.06;
    src.connect(bpf); bpf.connect(g); g.connect(_masterGain); src.start(t+0.08);
}

function _sfxLogro() {
    if (!_audioCtx||!_audioEnabled) return; _resumeAudio();
    const t=_audioCtx.currentTime;
    [261.6,329.6,392.0,523.3].forEach((freq,i)=>{
        const osc=_audioCtx.createOscillator(); const g=_audioCtx.createGain();
        osc.type='square'; osc.frequency.value=freq;
        const dt=t+i*0.13;
        g.gain.setValueAtTime(0,dt); g.gain.linearRampToValueAtTime(0.07,dt+0.04);
        g.gain.exponentialRampToValueAtTime(0.001,dt+0.4);
        osc.connect(g); g.connect(_masterGain); osc.start(dt); osc.stop(dt+0.45);
    });
}

function _sfxGameOver(victoria) {
    if (!_audioCtx||!_audioEnabled) return; _resumeAudio();
    const t=_audioCtx.currentTime;
    _stopOleaje();
    if (victoria) {
        [261.6,329.6,392.0,523.3,659.3].forEach((freq,i)=>{
            const osc=_audioCtx.createOscillator(); const g=_audioCtx.createGain();
            osc.type='sine'; osc.frequency.value=freq;
            const dt=t+i*0.16;
            g.gain.setValueAtTime(0,dt); g.gain.linearRampToValueAtTime(0.12,dt+0.07);
            g.gain.exponentialRampToValueAtTime(0.001,dt+2.0);
            osc.connect(g); g.connect(_masterGain); osc.start(dt); osc.stop(dt+2.2);
        });
    } else {
        const osc=_audioCtx.createOscillator(); const g=_audioCtx.createGain();
        osc.type='sawtooth'; osc.frequency.setValueAtTime(200,t);
        osc.frequency.linearRampToValueAtTime(50,t+2.5);
        g.gain.setValueAtTime(0.1,t); g.gain.linearRampToValueAtTime(0,t+2.8);
        osc.connect(g); g.connect(_masterGain); osc.start(t); osc.stop(t+3);
    }
}

function toggleAudio() {
    if (!_audioInitialized) { _initAudio(); return; }
    _audioEnabled=!_audioEnabled;
    if (_masterGain) _masterGain.gain.linearRampToValueAtTime(_audioEnabled?0.5:0, _audioCtx.currentTime+0.5);
    const btn=document.getElementById('btn-audio');
    if (btn) { btn.textContent=_audioEnabled?'🔊':'🔇'; btn.title=_audioEnabled?'Silenciar sonido':'Activar sonido'; }
}

function _sfxHitoHistorico() {
    if (!_audioCtx || !_audioEnabled) return; _resumeAudio();
    const t = _audioCtx.currentTime;
    const blR = Math.floor(_audioCtx.sampleRate * 0.35);
    const bufR = _audioCtx.createBuffer(1, blR, _audioCtx.sampleRate);
    const dR = bufR.getChannelData(0);
    for (let i = 0; i < blR; i++) dR[i] = (Math.random()*2-1) * Math.pow(1-i/blR,0.6) * 0.6;
    const srcR = _audioCtx.createBufferSource(); srcR.buffer = bufR;
    const bpR = _audioCtx.createBiquadFilter(); bpR.type = 'bandpass'; bpR.frequency.value = 180; bpR.Q.value = 4;
    const gR = _audioCtx.createGain(); gR.gain.value = 0.22;
    srcR.connect(bpR); bpR.connect(gR); gR.connect(_masterGain); srcR.start(t + 0.05);
    const fanfarria = [
        [261.6, 0.3,  'sine',     0.14, 0.9],
        [329.6, 0.65, 'sine',     0.13, 0.9],
        [392.0, 1.0,  'sine',     0.14, 0.95],
        [523.3, 1.35, 'sine',     0.16, 1.4],
        [659.3, 1.75, 'triangle', 0.10, 0.7],
        [784.0, 2.0,  'sine',     0.10, 0.7],
        [523.3, 2.3,  'sine',     0.18, 2.2],
    ];
    fanfarria.forEach(([freq, delay, type, vol, dur]) => {
        const osc = _audioCtx.createOscillator();
        const g   = _audioCtx.createGain();
        osc.type = type; osc.frequency.value = freq;
        const dt = t + delay;
        g.gain.setValueAtTime(0, dt);
        g.gain.linearRampToValueAtTime(vol, dt + 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, dt + dur);
        osc.connect(g); g.connect(_masterGain);
        osc.start(dt); osc.stop(dt + dur + 0.1);
    });
    [261.6, 329.6, 392.0, 523.3].forEach((freq, i) => {
        const osc = _audioCtx.createOscillator();
        const g   = _audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        const dt = t + 2.5;
        g.gain.setValueAtTime(0, dt);
        g.gain.linearRampToValueAtTime(0.08 - i*0.012, dt + 0.15);
        g.gain.setValueAtTime(0.08 - i*0.012, dt + 3.0);
        g.gain.exponentialRampToValueAtTime(0.001, dt + 4.5);
        osc.connect(g); g.connect(_masterGain);
        osc.start(dt); osc.stop(dt + 5.0);
    });
}

// Forzar inicialización de audio en el primer toque táctil o clic
// (necesario en Android y iOS donde AudioContext requiere gesto de usuario)
function _initAudioOnInteraction() {
    if (!_audioInitialized) {
        _initAudio();
    }
    // También resume si está suspendido (ocurre en Android Chrome)
    if (_audioCtx && _audioCtx.state === 'suspended') {
        _audioCtx.resume().catch(()=>{});
    }
}
document.addEventListener('pointerdown', _initAudioOnInteraction, {once:true});
// listener de respaldo por si pointerdown no se dispara
document.addEventListener('click', _initAudioOnInteraction, {once:true});

export { _AudioCtxClass, _audioCtx, _masterGain, _ambientNodes, _audioEnabled, _audioInitialized, _initAudio, _resumeAudio, _startOleaje, _stopOleaje, _sfxDecision, _sfxMoverBarco, _sfxLogro, _sfxGameOver, _sfxHitoHistorico, toggleAudio };
