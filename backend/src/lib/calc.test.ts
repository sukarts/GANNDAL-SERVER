import { describe, it, expect } from 'vitest';
import { calculerPige, montantDegradation, BAREME_DEGRADATION } from './calc.js';

describe('calculerPige', () => {
  it('somme sujets + minutes', () => {
    const r = calculerPige({ nbSujets: 6, totalMinutes: 18, tarifSujet: 25000, tarifMinute: 1500 });
    expect(r.montantSujets).toBe(150000);
    expect(r.montantMinutes).toBe(27000);
    expect(r.montantBase).toBe(177000);
    expect(r.montantTotal).toBe(177000);
  });

  it('applique bonus et pénalités', () => {
    const r = calculerPige({ nbSujets: 2, totalMinutes: 0, tarifSujet: 10000, tarifMinute: 0, bonus: 5000, penalites: 3000 });
    expect(r.montantBase).toBe(20000);
    expect(r.montantTotal).toBe(22000);
  });

  it('zéro sujet = zéro', () => {
    const r = calculerPige({ nbSujets: 0, totalMinutes: 0, tarifSujet: 25000, tarifMinute: 1500 });
    expect(r.montantTotal).toBe(0);
  });
});

describe('montantDegradation', () => {
  it('bon retour = pas de dégradation', () => {
    expect(montantDegradation('NEUF', 'BON_ETAT', 1000000)).toBe(0);
  });

  it('à réparer = 25% du coût', () => {
    expect(montantDegradation('BON_ETAT', 'A_REPARER', 2000000)).toBe(500000);
  });

  it('perdu = 100% du coût', () => {
    expect(montantDegradation('NEUF', 'PERDU', 2500000)).toBe(2500000);
  });

  it('déjà dégradé à la remise = ne compte que le delta', () => {
    // remis A_REPARER (0.25), rendu HORS_SERVICE (0.6) -> delta 0.35
    expect(montantDegradation('A_REPARER', 'HORS_SERVICE', 1000000)).toBe(350000);
  });

  it('amélioration = jamais négatif', () => {
    expect(montantDegradation('HORS_SERVICE', 'BON_ETAT', 1000000)).toBe(0);
  });

  it('barème couvre tous les états', () => {
    expect(Object.keys(BAREME_DEGRADATION)).toHaveLength(6);
  });
});
