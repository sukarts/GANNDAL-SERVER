import PDFDocument from 'pdfkit';
import type { Prisma } from '@prisma/client';
import type { Devise } from './currency.js';

type FicheComplete = Prisma.FichePaiementGetPayload<{
  include: { jri: true; lignes: true };
}>;

type FicheBordereau = Prisma.FichePaiementGetPayload<{
  include: { jri: { include: { jriProfile: true } } };
}>;

// Ordre de paiement (bordereau) : liste des piges à régler pour une période.
export function genererBordereauPdf(fiches: FicheBordereau[], annee: number, mois: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('GANNDAL — Ordre de paiement des piges', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666').text(`Période : ${String(mois).padStart(2, '0')}/${annee}`, { align: 'center' });
    doc.moveDown();

    // En-têtes
    const y0 = doc.y;
    doc.fillColor('#000').fontSize(9);
    doc.text('JRI', 40, y0, { width: 130 });
    doc.text('Coordonnées', 170, y0, { width: 200 });
    doc.text('Réf. pige', 370, y0, { width: 90 });
    doc.text('Montant (GNF)', 460, y0, { width: 95, align: 'right' });
    doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke('#ccc');
    doc.moveDown(0.5);

    let total = 0;
    for (const f of fiches) {
      total += Number(f.montantTotal);
      const y = doc.y;
      doc.fontSize(9).fillColor('#000');
      doc.text(`${f.jri.prenom} ${f.jri.nom}`, 40, y, { width: 130 });
      doc.text(f.jri.jriProfile?.iban ?? f.jri.email, 170, y, { width: 200 });
      doc.text(f.reference, 370, y, { width: 90 });
      doc.text(Number(f.montantTotal).toLocaleString('fr-FR'), 460, y, { width: 95, align: 'right' });
      doc.moveDown(0.8);
    }

    doc.moveTo(40, doc.y + 2).lineTo(555, doc.y + 2).stroke('#ccc');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#1a7f37')
      .text(`TOTAL À PAYER : ${total.toLocaleString('fr-FR')} GNF`, 40, doc.y, { width: 515, align: 'right' });
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#000');
    doc.text('Visa comptable : ____________________          Visa direction : ____________________');

    doc.end();
  });
}

// Devise GNF de base par défaut (taux 1)
const GNF: Devise = { code: 'GNF', nom: 'Franc guinéen', symbole: 'GNF', tauxGnf: 1 };

// Génère le PDF d'une fiche de paiement et retourne le buffer.
// `devise` (optionnel) convertit l'affichage ; le taux est figé et imprimé.
export function genererFichePaiementPdf(fiche: FicheComplete, devise: Devise = GNF): Promise<Buffer> {
  const conv = (gnf: number | string) => Number(gnf) / devise.tauxGnf;
  const fmt = (gnf: number | string) =>
    `${conv(gnf).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${devise.code}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('GANNDAL — Fiche de pige', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666')
      .text(`Référence: ${fiche.reference}`, { align: 'center' })
      .text(`Période: ${String(fiche.mois).padStart(2, '0')}/${fiche.annee}`, { align: 'center' });
    doc.moveDown();

    doc.fillColor('#000').fontSize(12);
    doc.text(`JRI: ${fiche.jri.prenom} ${fiche.jri.nom}`);
    doc.text(`Email: ${fiche.jri.email}`);
    doc.text(`Sujets validés: ${fiche.nbSujets}   |   Minutes produites: ${fiche.totalMinutes}`);
    doc.moveDown();

    // Tableau des lignes
    doc.fontSize(11).text('Détail', { underline: true });
    doc.moveDown(0.3);
    fiche.lignes.forEach((l) => {
      doc.fontSize(10).text(
        `${l.libelle}  —  ${l.quantite} × ${fmt(l.tarif as unknown as string)} = ${fmt(l.montant as unknown as string)}`,
      );
    });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Montant de base : ${fmt(fiche.montantBase as unknown as string)}`);
    doc.text(`Bonus : ${fmt(fiche.bonus as unknown as string)}`);
    doc.text(`Pénalités : -${fmt(fiche.penalites as unknown as string)}`);
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#1a7f37')
      .text(`TOTAL À PAYER : ${fmt(fiche.montantTotal as unknown as string)}`);

    if (devise.code !== 'GNF') {
      doc.moveDown(0.5).fontSize(8).fillColor('#888')
        .text(`Conversion au taux figé : 1 ${devise.code} = ${devise.tauxGnf} GNF — montants canoniques en GNF.`);
    }

    doc.end();
  });
}
