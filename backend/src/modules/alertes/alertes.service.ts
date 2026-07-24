import { prisma } from '../../lib/prisma.js';
import { notify } from '../../lib/notify.js';
import type { CanalNotif } from '@prisma/client';

// Seuils configurables (jours)
const SEUIL_GARANTIE_JOURS = 30; // garantie proche d'expiration
const SEUIL_NON_RESTITUE_JOURS = 90; // dotation en cours trop longue
const SEUIL_ENTRETIEN_JOURS = 7; // ticket de maintenance ouvert non résolu

export interface AlerteResume {
  garantie: number;
  nonRestitue: number;
  entretien: number;
  sujetsEnRetard: number;
  total: number;
}

// Destinataires des alertes: admins + rédacteurs (logistique)
async function destinataires(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'REDACTEUR'] }, actif: true },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

// Évite les doublons: pas de notification identique non lue dans les 7 derniers jours
async function notifierUnique(
  userId: string,
  titre: string,
  message: string,
  lien: string,
  canaux: CanalNotif[],
): Promise<boolean> {
  const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const existe = await prisma.notification.findFirst({
    where: { userId, lien, lu: false, createdAt: { gte: depuis } },
  });
  if (existe) return false;
  await notify({ userId, titre, message, lien, canaux });
  return true;
}

// Garantie proche d'expiration
async function alerteGarantie(dests: string[]): Promise<number> {
  const limite = new Date(Date.now() + SEUIL_GARANTIE_JOURS * 24 * 3600 * 1000);
  const materiels = await prisma.materiel.findMany({
    where: {
      garantieFin: { not: null, lte: limite, gte: new Date() },
      statut: { notIn: ['PERDU', 'VOLE'] },
    },
  });
  let n = 0;
  for (const m of materiels) {
    for (const uid of dests) {
      const ok = await notifierUnique(
        uid,
        'Garantie proche d’expiration',
        `${m.reference} (${m.marque ?? ''} ${m.modele ?? ''}) — garantie jusqu’au ${m.garantieFin?.toLocaleDateString('fr-FR')}.`,
        `/materiel/${m.id}?alerte=garantie`,
        ['INTERNE', 'EMAIL'],
      );
      if (ok) n++;
    }
  }
  return n;
}

// Matériel affecté non restitué au-delà du seuil
async function alerteNonRestitue(dests: string[]): Promise<number> {
  const limite = new Date(Date.now() - SEUIL_NON_RESTITUE_JOURS * 24 * 3600 * 1000);
  const dotations = await prisma.dotation.findMany({
    where: { statut: 'EN_COURS', dateRemise: { lte: limite } },
    include: { materiel: true, jri: { select: { nom: true, prenom: true } } },
  });
  let n = 0;
  for (const d of dotations) {
    for (const uid of dests) {
      const ok = await notifierUnique(
        uid,
        'Matériel non restitué',
        `${d.materiel.reference} détenu par ${d.jri.prenom} ${d.jri.nom} depuis le ${d.dateRemise.toLocaleDateString('fr-FR')} (> ${SEUIL_NON_RESTITUE_JOURS} j).`,
        `/dotations/${d.id}?alerte=non-restitue`,
        ['INTERNE', 'EMAIL'],
      );
      if (ok) n++;
    }
  }
  return n;
}

// Ticket de maintenance ouvert (sans remise en service) au-delà du seuil
async function alerteEntretien(dests: string[]): Promise<number> {
  const limite = new Date(Date.now() - SEUIL_ENTRETIEN_JOURS * 24 * 3600 * 1000);
  const tickets = await prisma.maintenance.findMany({
    where: { dateRemiseEnService: null, datePanne: { lte: limite } },
    include: { materiel: true },
  });
  let n = 0;
  for (const t of tickets) {
    for (const uid of dests) {
      const ok = await notifierUnique(
        uid,
        'Entretien en attente',
        `${t.materiel.reference} en maintenance depuis le ${t.datePanne.toLocaleDateString('fr-FR')} — non remis en service.`,
        `/materiel/${t.materielId}?alerte=entretien`,
        ['INTERNE'],
      );
      if (ok) n++;
    }
  }
  return n;
}

// Sujets en retard : échéance dépassée, pas encore livrés → relance JRI + rédacteurs
async function alerteSujetsEnRetard(dests: string[]): Promise<number> {
  const sujets = await prisma.sujet.findMany({
    where: {
      dateLimite: { not: null, lt: new Date() },
      statut: { in: ['ASSIGNE', 'EN_COURS', 'REJETE'] },
    },
    include: { jri: { select: { nom: true, prenom: true } } },
  });
  let n = 0;
  for (const s of sujets) {
    const message = `« ${s.titre} » (${s.reference}) — échéance ${s.dateLimite?.toLocaleDateString('fr-FR')} dépassée, statut ${s.statut}.`;
    const lien = `/sujets/${s.id}?alerte=retard`;
    // Le JRI concerné
    if (s.jriId) {
      const ok = await notifierUnique(s.jriId, 'Sujet en retard', message, lien, ['INTERNE', 'EMAIL', 'WHATSAPP']);
      if (ok) n++;
    }
    // Les rédacteurs / admins
    for (const uid of dests) {
      const ok = await notifierUnique(uid, 'Sujet en retard', message, lien, ['INTERNE']);
      if (ok) n++;
    }
  }
  return n;
}

// Exécute toutes les alertes et retourne un résumé
export async function runAlertes(): Promise<AlerteResume> {
  const dests = await destinataires();
  const [garantie, nonRestitue, entretien, sujetsEnRetard] = await Promise.all([
    alerteGarantie(dests),
    alerteNonRestitue(dests),
    alerteEntretien(dests),
    alerteSujetsEnRetard(dests),
  ]);
  return { garantie, nonRestitue, entretien, sujetsEnRetard, total: garantie + nonRestitue + entretien + sujetsEnRetard };
}
