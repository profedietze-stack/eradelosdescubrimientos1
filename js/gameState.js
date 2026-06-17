import { DIFICULTAD_CONFIG } from '../data/dificultad.js';

const gameState = {
    moral:80, suministros:90, integridad:85, autoridad:75,
    progress:0, currentEventIndex:0, criticoCorrecto:null, decisionsHistory:[],
    playerName:'', dificultad:'estudiante',
    hitoAmericaAplicado: false,
    azoresAplicado: false,
    _nuncaCastigoCruel: true,
    _moralMinima: 80,
    _partidaTimer: null,
    _tipoResultadoActual: 'parcial',
    _hitoYaMostrado: false,
    _pendingContinuar: null,
    _lsTabActual: 'overview',
    _storageAdvertido: false,
};

function createInitialState(dificultad) {
    const dConf = DIFICULTAD_CONFIG[dificultad] || DIFICULTAD_CONFIG.historiador;
    return {
        moral: dConf.statsBase.moral,
        suministros: dConf.statsBase.suministros,
        integridad: dConf.statsBase.integridad,
        autoridad: dConf.statsBase.autoridad,
        progress: 0, currentEventIndex: 0, criticoCorrecto: null, decisionsHistory: [],
        playerName: gameState.playerName,
        dificultad: dificultad,
        hitoAmericaAplicado: false,
        azoresAplicado: false,
    };
}

export { gameState, createInitialState };
