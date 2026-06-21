import { prisma } from './prisma.js';

// Génère une référence séquentielle annuelle: PREFIX-AAAA-XXXX
export async function nextRef(prefix: string, model: 'sujet' | 'fichePaiement'): Promise<string> {
  const year = new Date().getFullYear();
  const like = `${prefix}-${year}-`;
  const count =
    model === 'sujet'
      ? await prisma.sujet.count({ where: { reference: { startsWith: like } } })
      : await prisma.fichePaiement.count({ where: { reference: { startsWith: like } } });
  return `${like}${String(count + 1).padStart(4, '0')}`;
}
