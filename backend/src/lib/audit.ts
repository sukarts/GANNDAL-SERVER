import { prisma } from './prisma.js';

interface AuditInput {
  userId?: string | null;
  action: string; // CREATE | UPDATE | DELETE | ASSIGN | VALIDATE | RESTITUTION...
  entite: string;
  entiteId?: string | null;
  details?: unknown;
  ip?: string | null;
}

// Journalisation centralisée — toutes les actions sensibles passent ici
export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entite: input.entite,
        entiteId: input.entiteId ?? null,
        details: (input.details ?? undefined) as object | undefined,
        ip: input.ip ?? null,
      },
    });
  } catch (e) {
    // Ne jamais casser la requête métier à cause de l'audit
    console.error('[audit] échec écriture log', e);
  }
}
