import { describe, it, expect } from 'vitest';
import { createInitialState } from '../js/gameState.js';

describe('createInitialState', () => {
    it('returns default stats for estudiante difficulty', () => {
        const s = createInitialState('estudiante');
        expect(s.moral).toBe(90);
        expect(s.suministros).toBe(95);
        expect(s.integridad).toBe(90);
        expect(s.autoridad).toBe(80);
        expect(s.progress).toBe(0);
        expect(s.currentEventIndex).toBe(0);
    });

    it('returns correct stats for historiador difficulty', () => {
        const s = createInitialState('historiador');
        expect(s.moral).toBe(80);
        expect(s.progress).toBe(0);
    });

    it('returns correct stats for almirante difficulty', () => {
        const s = createInitialState('almirante');
        expect(s.moral).toBe(65);
        expect(s.progress).toBe(0);
    });

    it('defaults to historiador for unknown difficulty', () => {
        const s = createInitialState('unknown');
        expect(s.moral).toBe(80);
    });

    it('includes playerName and dificultad in returned object', () => {
        const s = createInitialState('estudiante');
        expect(s).toHaveProperty('playerName');
        expect(s).toHaveProperty('dificultad');
        expect(s.dificultad).toBe('estudiante');
    });

    it('includes hitoAmericaAplicado and azoresAplicado flags', () => {
        const s = createInitialState('estudiante');
        expect(s.hitoAmericaAplicado).toBe(false);
        expect(s.azoresAplicado).toBe(false);
    });
});
