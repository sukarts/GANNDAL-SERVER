import type { EtatMateriel } from '@prisma/client';

// Calcul du montant d'une pige (tout en GNF)
export interface PigeInput {
  nbSujets: number;
  totalMinutes: number;
  tarifSujet: number;
  tarifMinute: number;
  bonus?: number;
  penalites?: number;
}
export interface PigeResult {
  montantSujets: number;
  montantMinutes: number;
  montantBase: number;
  montantTotal: number;
}

export function calculerPige(i: PigeInput): PigeResult {
  const montantSujets = i.nbSujets * i.tarifSujet;
  const montantMinutes = i.totalMinutes * i.tarifMinute;
  const montantBase = montantSujets + montantMinutes;
  const montantTotal = montantBase + (i.bonus ?? 0) - (i.penalites ?? 0);
  return { montantSujets, montantMinutes, montantBase, montantTotal };
}

// Barème de dégradation matériel (% du coût d'acquisition) par état
export const BAREME_DEGRADATION: Record<EtatMateriel, number> = {
  NEUF: 0, BON_ETAT: 0, A_REPARER: 0.25, HORS_SERVICE: 0.6, PERDU: 1, VOLE: 1,
};

// Montant de dégradation = max(0, baremeRetour - baremeRemise) × coût, arrondi
export function montantDegradation(etatRemise: EtatMateriel, etatRetour: EtatMateriel, cout: number): number {
  const delta = Math.max(0, BAREME_DEGRADATION[etatRetour] - BAREME_DEGRADATION[etatRemise]);
  return Math.round(delta * cout);
}
