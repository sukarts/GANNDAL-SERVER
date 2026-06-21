import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ganndal.media' },
    update: {},
    create: { email: 'admin@ganndal.media', passwordHash: await hash('Admin123!'), nom: 'Diallo', prenom: 'Awa', role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: 'redacteur@ganndal.media' },
    update: {},
    create: { email: 'redacteur@ganndal.media', passwordHash: await hash('Redac123!'), nom: 'Ndiaye', prenom: 'Moussa', role: 'REDACTEUR' },
  });

  await prisma.user.upsert({
    where: { email: 'comptable@ganndal.media' },
    update: {},
    create: { email: 'comptable@ganndal.media', passwordHash: await hash('Compta123!'), nom: 'Sow', prenom: 'Fatou', role: 'COMPTABLE' },
  });

  const jri = await prisma.user.upsert({
    where: { email: 'jri@ganndal.media' },
    update: {},
    create: {
      email: 'jri@ganndal.media',
      passwordHash: await hash('Jri123!'),
      nom: 'Ba',
      prenom: 'Ousmane',
      telephone: '+221770000000',
      role: 'JRI',
      jriProfile: { create: { tarifParSujet: 25000, tarifParMinute: 1500, specialite: 'Reportage terrain' } },
    },
  });

  // Devises (base = GNF). Taux indicatifs — à ajuster par l'admin.
  const devises = [
    { code: 'GNF', nom: 'Franc guinéen', symbole: 'FG', tauxGnf: 1, parDefaut: true },
    { code: 'USD', nom: 'Dollar US', symbole: '$', tauxGnf: 8600, parDefaut: false },
    { code: 'EUR', nom: 'Euro', symbole: '€', tauxGnf: 9300, parDefaut: false },
    { code: 'XOF', nom: 'Franc CFA (UEMOA)', symbole: 'CFA', tauxGnf: 14.2, parDefaut: false },
    { code: 'NGN', nom: 'Naira', symbole: '₦', tauxGnf: 5.6, parDefaut: false },
  ];
  for (const d of devises) {
    await prisma.currency.upsert({ where: { code: d.code }, update: {}, create: d });
  }

  // Catégories de matériel
  const categories = [
    'Caméras', 'Smartphones', 'Appareils photo', 'Micros', 'Enregistreurs audio',
    'Trépieds', 'Éclairages', 'Ordinateurs portables', 'Disques durs', 'Batteries',
    'Routeurs Internet', 'Véhicules', 'Accessoires divers',
  ];
  for (const nom of categories) {
    await prisma.categorieMateriel.upsert({ where: { nom }, update: {}, create: { nom } });
  }
  const camera = await prisma.categorieMateriel.findUnique({ where: { nom: 'Caméras' } });

  // Matériel de démo
  await prisma.materiel.upsert({
    where: { reference: 'CAM-001' },
    update: {},
    create: {
      reference: 'CAM-001',
      numInventaire: 'INV-2026-0001',
      categorieId: camera!.id,
      marque: 'Sony',
      modele: 'FX3',
      numSerie: 'SN123456',
      coutAcquisition: 2500000,
      etat: 'NEUF',
      statut: 'DISPONIBLE',
    },
  });

  // Sujet de démo
  await prisma.sujet.upsert({
    where: { reference: 'SUJ-2026-0001' },
    update: {},
    create: {
      reference: 'SUJ-2026-0001',
      titre: 'Reportage marché central',
      description: 'Sujet de 3 minutes sur le marché central de Dakar',
      jriId: jri.id,
      createdById: admin.id,
      priorite: 'HAUTE',
      statut: 'ASSIGNE',
      dureeMinutes: 3,
    },
  });

  console.log('✅ Seed terminé. Comptes: admin/redacteur/comptable/jri @ganndal.media');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
