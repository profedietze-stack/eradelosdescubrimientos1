import { describe, it, expect } from 'vitest';
import { EVENTOS_FIJOS } from '../data/eventosFijos.js';
import { POOL_EVENTOS } from '../data/poolEventos.js';
import { DIFICULTAD_CONFIG } from '../data/dificultad.js';
import { RUTA_COLON } from '../data/rutas.js';
import { GLOSARIO } from '../data/glosario.js';

describe('EVENTOS_FIJOS', () => {
    const entries = Object.entries(EVENTOS_FIJOS);
    const fijos = Object.values(EVENTOS_FIJOS);

    it('has 17 fixed events', () => {
        expect(fijos.length).toBe(17);
    });

    it('each event has id, texto, opciones', () => {
        for (const ev of fijos) {
            expect(ev).toHaveProperty('id');
            expect(ev).toHaveProperty('texto');
            expect(ev).toHaveProperty('opciones');
        }
    });

    it('each event key is a valid position (0-39)', () => {
        for (const [key] of entries) {
            const pos = Number(key);
            expect(Number.isInteger(pos)).toBe(true);
            expect(pos).toBeGreaterThanOrEqual(0);
            expect(pos).toBeLessThan(40);
        }
    });

    it('no duplicate positions', () => {
        const positions = entries.map(([k]) => Number(k));
        expect(new Set(positions).size).toBe(positions.length);
    });

    it('each event has at least 1 option', () => {
        for (const ev of fijos) {
            expect(ev.opciones.length).toBeGreaterThanOrEqual(1);
        }
    });

    it('each option has texto and efectos', () => {
        for (const ev of fijos) {
            for (const op of ev.opciones) {
                expect(op).toHaveProperty('texto');
                expect(op).toHaveProperty('efectos');
                expect(op.efectos).toHaveProperty('moral');
                expect(op.efectos).toHaveProperty('suministros');
                expect(op.efectos).toHaveProperty('integridad');
                expect(op.efectos).toHaveProperty('autoridad');
            }
        }
    });

    it('textos have no replacement characters', () => {
        for (const ev of fijos) {
            expect(ev.texto).not.toContain('\uFFFD');
            for (const op of ev.opciones) {
                expect(op.texto).not.toContain('\uFFFD');
            }
        }
    });
});

describe('POOL_EVENTOS', () => {
    it('has pool events to fill remaining positions', () => {
        expect(POOL_EVENTOS.length).toBeGreaterThanOrEqual(20);
    });

    it('each event has required fields', () => {
        for (const ev of POOL_EVENTOS) {
            expect(ev).toHaveProperty('id');
            expect(ev).toHaveProperty('texto');
            expect(ev).toHaveProperty('opciones');
        }
    });

    it('each option has efectos', () => {
        for (const ev of POOL_EVENTOS) {
            for (const op of ev.opciones) {
                expect(op.efectos).toHaveProperty('moral');
                expect(op.efectos).toHaveProperty('suministros');
                expect(op.efectos).toHaveProperty('integridad');
                expect(op.efectos).toHaveProperty('autoridad');
            }
        }
    });

    it('textos have no replacement characters', () => {
        for (const ev of POOL_EVENTOS) {
            expect(ev.texto).not.toContain('\uFFFD');
            for (const op of ev.opciones) {
                expect(op.texto).not.toContain('\uFFFD');
            }
        }
    });
});

describe('DIFICULTAD_CONFIG', () => {
    it('has 3 difficulty levels', () => {
        expect(Object.keys(DIFICULTAD_CONFIG).length).toBe(3);
    });

    it('has keys: estudiante, historiador, almirante', () => {
        const keys = Object.keys(DIFICULTAD_CONFIG).sort();
        expect(keys).toEqual(['almirante', 'estudiante', 'historiador']);
    });

    for (const dif of ['estudiante', 'historiador', 'almirante']) {
        it(`${dif} has statsBase with all 4 resources`, () => {
            const cfg = DIFICULTAD_CONFIG[dif];
            expect(cfg.statsBase).toHaveProperty('moral');
            expect(cfg.statsBase).toHaveProperty('suministros');
            expect(cfg.statsBase).toHaveProperty('integridad');
            expect(cfg.statsBase).toHaveProperty('autoridad');
        });
    }
});

describe('RUTA_COLON', () => {
    it('has 21 waypoints', () => {
        expect(RUTA_COLON.length).toBe(21);
    });

    it('each waypoint is a [lng, lat] pair', () => {
        for (const wp of RUTA_COLON) {
            expect(Array.isArray(wp)).toBe(true);
            expect(wp.length).toBe(2);
            expect(typeof wp[0]).toBe('number');
            expect(typeof wp[1]).toBe('number');
        }
    });
});

describe('GLOSARIO', () => {
    const entries = Object.entries(GLOSARIO);

    it('has at least 10 glossary entries', () => {
        expect(entries.length).toBeGreaterThanOrEqual(10);
    });

    it('each entry has non-empty term and definition', () => {
        for (const [term, def] of entries) {
            expect(term.length).toBeGreaterThan(0);
            expect(def.length).toBeGreaterThan(0);
            expect(def).not.toContain('\uFFFD');
        }
    });
});
