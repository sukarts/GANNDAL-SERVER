'use client';
import { useLang } from '@/lib/i18n';

type Tone = 'gris' | 'info' | 'success' | 'warning' | 'danger';
type Kind = 'sujet' | 'fiche' | 'dotation' | 'materiel' | 'priorite';

const TONE: Record<Tone, string> = {
  gris: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
};

// [libellé FR, libellé EN, ton]
type Entry = [string, string, Tone];
const MAP: Record<Kind, Record<string, Entry>> = {
  sujet: {
    ASSIGNE: ['Assigné', 'Assigned', 'gris'],
    EN_COURS: ['En cours', 'In progress', 'info'],
    LIVRE: ['Livré', 'Delivered', 'warning'],
    VALIDE: ['Validé', 'Approved', 'success'],
    REJETE: ['Rejeté', 'Rejected', 'danger'],
  },
  fiche: {
    BROUILLON: ['Brouillon', 'Draft', 'gris'],
    GENEREE: ['Générée', 'Generated', 'info'],
    PAYEE: ['Payée', 'Paid', 'success'],
  },
  dotation: {
    EN_COURS: ['En cours', 'Out', 'warning'],
    RESTITUE: ['Restitué', 'Returned', 'success'],
  },
  materiel: {
    DISPONIBLE: ['Disponible', 'Available', 'success'],
    AFFECTE: ['Affecté', 'Assigned', 'info'],
    MAINTENANCE: ['Maintenance', 'Maintenance', 'warning'],
    PERDU: ['Perdu', 'Lost', 'danger'],
    VOLE: ['Volé', 'Stolen', 'danger'],
  },
  priorite: {
    BASSE: ['Basse', 'Low', 'gris'],
    NORMALE: ['Normale', 'Normal', 'info'],
    HAUTE: ['Haute', 'High', 'warning'],
    URGENTE: ['Urgente', 'Urgent', 'danger'],
  },
};

export default function StatutBadge({ kind, value }: { kind: Kind; value: string }) {
  const { t } = useLang();
  const entry = MAP[kind]?.[value];
  const [fr, en, tone] = entry ?? [value, value, 'gris' as Tone];
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>
      {t(fr, en)}
    </span>
  );
}
