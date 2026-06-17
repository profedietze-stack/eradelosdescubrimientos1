import { describe, it, expect } from 'vitest';
import { _fmtTiempo, _labelRes, detectarContextoEvento } from '../js/utils.js';

describe('_fmtTiempo', () => {
    it('returns "0 min" for falsy values', () => {
        expect(_fmtTiempo(0)).toBe('0 min');
        expect(_fmtTiempo(null)).toBe('0 min');
        expect(_fmtTiempo(undefined)).toBe('0 min');
    });

    it('formats hours and minutes', () => {
        expect(_fmtTiempo(3661)).toBe('1h 1m');
    });

    it('formats minutes and seconds', () => {
        expect(_fmtTiempo(125)).toBe('2m 5s');
    });

    it('formats only seconds', () => {
        expect(_fmtTiempo(45)).toBe('45s');
    });
});

describe('_labelRes', () => {
    it('returns label for victoria', () => {
        expect(_labelRes('victoria')).toContain('Victoria');
    });

    it('returns label for parcial', () => {
        expect(_labelRes('parcial')).toContain('Parcial');
    });

    it('returns label for derrota', () => {
        expect(_labelRes('derrota')).toContain('Derrota');
    });
});

describe('detectarContextoEvento', () => {
    it('detects peligro context for mutiny words', () => {
        expect(detectarContextoEvento('Habrá un motín seguro')).toBe('ctx-peligro');
    });

    it('detects critico context for critical words', () => {
        expect(detectarContextoEvento('Es un evento crítico')).toBe('ctx-critico');
    });

    it('detects peligro context for storm words', () => {
        expect(detectarContextoEvento('Una gran tormenta se acerca')).toBe('ctx-peligro');
    });

    it('detects tierra context for land words', () => {
        expect(detectarContextoEvento('Avistamos tierra a lo lejos')).toBe('ctx-tierra');
    });

    it('detects mar context for ocean words', () => {
        expect(detectarContextoEvento('El océano está tranquilo')).toBe('ctx-mar');
    });

    it('returns empty string for neutral text', () => {
        expect(detectarContextoEvento('Las provisiones están bajas')).toBe('');
    });

    it('is case insensitive', () => {
        expect(detectarContextoEvento('MOTÍN a bordo')).toBe('ctx-peligro');
    });

    it('handles accented characters correctly', () => {
        expect(detectarContextoEvento('motín')).toBe('ctx-peligro');
        expect(detectarContextoEvento('crítico')).toBe('ctx-critico');
        expect(detectarContextoEvento('océano')).toBe('ctx-mar');
    });
});
