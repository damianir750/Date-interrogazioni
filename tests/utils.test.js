import { describe, it, expect } from 'vitest';
import { validateStudent, validateSubject, validateUpdateStudent } from '../api/_utils.js';

// =====================================================
// validateStudent
// =====================================================
describe('validateStudent', () => {
    it('accepts valid student data', () => {
        const errors = validateStudent({
            name: 'Mario Rossi',
            subject: 'Matematica',
            last_interrogation: '2026-01-15',
            grades_count: 3
        });
        expect(errors).toEqual([]);
    });

    it('accepts student without optional fields', () => {
        const errors = validateStudent({ name: 'Mario', subject: 'Italiano' });
        expect(errors).toEqual([]);
    });

    it('rejects missing name', () => {
        const errors = validateStudent({ subject: 'Italiano' });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('name');
    });

    it('rejects non-string name', () => {
        const errors = validateStudent({ name: 123, subject: 'Italiano' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects name over 100 characters', () => {
        const errors = validateStudent({ name: 'A'.repeat(101), subject: 'Italiano' });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('100');
    });

    it('rejects missing subject', () => {
        const errors = validateStudent({ name: 'Mario' });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('subject');
    });

    it('rejects subject over 50 characters', () => {
        const errors = validateStudent({ name: 'Mario', subject: 'A'.repeat(51) });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid date format', () => {
        const errors = validateStudent({
            name: 'Mario',
            subject: 'Italiano',
            last_interrogation: '15-01-2026'
        });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('YYYY-MM-DD');
    });

    it('rejects negative grades_count', () => {
        const errors = validateStudent({
            name: 'Mario',
            subject: 'Italiano',
            grades_count: -1
        });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects non-number grades_count', () => {
        const errors = validateStudent({
            name: 'Mario',
            subject: 'Italiano',
            grades_count: 'tre'
        });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('collects multiple errors at once', () => {
        const errors = validateStudent({});
        expect(errors.length).toBeGreaterThanOrEqual(2);
    });
});

// =====================================================
// validateSubject
// =====================================================
describe('validateSubject', () => {
    it('accepts valid subject data', () => {
        const errors = validateSubject({ name: 'Matematica', color: '#FF0000' });
        expect(errors).toEqual([]);
    });

    it('accepts lowercase hex', () => {
        const errors = validateSubject({ name: 'Italiano', color: '#ff00aa' });
        expect(errors).toEqual([]);
    });

    it('rejects missing name', () => {
        const errors = validateSubject({ color: '#FF0000' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects name over 50 characters', () => {
        const errors = validateSubject({ name: 'A'.repeat(51), color: '#FF0000' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects missing color', () => {
        const errors = validateSubject({ name: 'Matematica' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid hex color - too short', () => {
        const errors = validateSubject({ name: 'Matematica', color: '#FFF' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid hex color - no hash', () => {
        const errors = validateSubject({ name: 'Matematica', color: 'FF0000' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects CSS color names', () => {
        const errors = validateSubject({ name: 'Matematica', color: 'red' });
        expect(errors.length).toBeGreaterThan(0);
    });

    // XSS test: reject CSS injection attempts
    it('rejects CSS injection in color field', () => {
        const errors = validateSubject({
            name: 'Test',
            color: 'red;background-image:url(https://evil.com)'
        });
        expect(errors.length).toBeGreaterThan(0);
    });
});

// =====================================================
// validateUpdateStudent
// =====================================================
describe('validateUpdateStudent', () => {
    it('accepts valid update with all fields', () => {
        const errors = validateUpdateStudent({
            id: 1,
            name: 'Mario Rossi',
            grades_count: 5,
            last_interrogation: '2026-02-01'
        });
        expect(errors).toEqual([]);
    });

    it('accepts update with only id (no changes)', () => {
        const errors = validateUpdateStudent({ id: 1 });
        expect(errors).toEqual([]);
    });

    it('accepts update with only name', () => {
        const errors = validateUpdateStudent({ id: 1, name: 'Nuovo Nome' });
        expect(errors).toEqual([]);
    });

    it('accepts null last_interrogation (reset)', () => {
        const errors = validateUpdateStudent({ id: 1, last_interrogation: null });
        expect(errors).toEqual([]);
    });

    it('rejects missing id', () => {
        const errors = validateUpdateStudent({ name: 'Mario' });
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('id');
    });

    it('rejects name over 100 characters', () => {
        const errors = validateUpdateStudent({ id: 1, name: 'A'.repeat(101) });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects invalid date in update', () => {
        const errors = validateUpdateStudent({ id: 1, last_interrogation: 'not-a-date' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects negative grades_count in update', () => {
        const errors = validateUpdateStudent({ id: 1, grades_count: -5 });
        expect(errors.length).toBeGreaterThan(0);
    });
});
