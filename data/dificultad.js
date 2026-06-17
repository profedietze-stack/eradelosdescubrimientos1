export const DIFICULTAD_CONFIG = {
    estudiante: {
        label: 'Valores iniciales altos · efectos negativos reducidos al 70% · ideal para primera partida',
        statsBase: { moral:90, suministros:95, integridad:90, autoridad:80 },
        multiplicadorNegativo: 0.7,
    },
    historiador: {
        label: 'Valores estándar · sin modificadores · la experiencia histórica real',
        statsBase: { moral:80, suministros:90, integridad:85, autoridad:75 },
        multiplicadorNegativo: 1.0,
    },
    almirante: {
        label: 'Valores iniciales bajos · efectos negativos amplificados al 130% · para veteranos',
        statsBase: { moral:65, suministros:75, integridad:70, autoridad:60 },
        multiplicadorNegativo: 1.3,
    },
};
