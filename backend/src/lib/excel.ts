import ExcelJS from 'exceljs';
import type { Prisma } from '@prisma/client';

type FicheComplete = Prisma.FichePaiementGetPayload<{ include: { jri: true } }>;

// Export Excel d'un lot de fiches de paiement (ex: paie mensuelle)
export async function genererPaieExcel(fiches: FicheComplete[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Paie');

  ws.columns = [
    { header: 'Référence', key: 'reference', width: 22 },
    { header: 'JRI', key: 'jri', width: 28 },
    { header: 'Période', key: 'periode', width: 12 },
    { header: 'Sujets', key: 'nbSujets', width: 10 },
    { header: 'Minutes', key: 'minutes', width: 10 },
    { header: 'Base', key: 'base', width: 14 },
    { header: 'Bonus', key: 'bonus', width: 12 },
    { header: 'Pénalités', key: 'penalites', width: 12 },
    { header: 'Total', key: 'total', width: 16 },
    { header: 'Statut', key: 'statut', width: 12 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const f of fiches) {
    ws.addRow({
      reference: f.reference,
      jri: `${f.jri.prenom} ${f.jri.nom}`,
      periode: `${String(f.mois).padStart(2, '0')}/${f.annee}`,
      nbSujets: f.nbSujets,
      minutes: f.totalMinutes,
      base: Number(f.montantBase),
      bonus: Number(f.bonus),
      penalites: Number(f.penalites),
      total: Number(f.montantTotal),
      statut: f.statut,
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
