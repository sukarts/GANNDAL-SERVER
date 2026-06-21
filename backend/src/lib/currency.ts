import { prisma } from './prisma.js';
import { badRequest } from './http.js';

export interface Devise {
  code: string;
  nom: string;
  symbole: string;
  tauxGnf: number; // 1 unité de cette devise = tauxGnf GNF
}

// Récupère une devise active ; lève si introuvable
export async function getDevise(code: string): Promise<Devise> {
  const d = await prisma.currency.findUnique({ where: { code } });
  if (!d || !d.actif) throw badRequest(`Devise inconnue ou inactive: ${code}`);
  return { code: d.code, nom: d.nom, symbole: d.symbole, tauxGnf: Number(d.tauxGnf) };
}

// Montant exprimé en GNF -> devise cible
export function fromGnf(montantGnf: number, devise: Devise): number {
  return montantGnf / devise.tauxGnf;
}

// Conversion générique entre deux devises (via la base GNF)
export async function convert(montant: number, from: string, to: string): Promise<number> {
  const [a, b] = await Promise.all([getDevise(from), getDevise(to)]);
  return (montant * a.tauxGnf) / b.tauxGnf;
}
