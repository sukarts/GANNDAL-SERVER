import { api } from './api';

export interface Devise {
  code: string;
  nom: string;
  symbole: string;
  tauxGnf: string | number; // 1 unité = tauxGnf GNF
}

const LS_LIST = 'ganndal_currencies';
const LS_SEL = 'ganndal_currency';

// Charge la liste des devises actives et met en cache (localStorage)
export async function loadCurrencies(): Promise<Devise[]> {
  const list = await api<Devise[]>('/currencies');
  localStorage.setItem(LS_LIST, JSON.stringify(list));
  if (!localStorage.getItem(LS_SEL)) {
    const defaut = list[0]?.code ?? 'GNF';
    localStorage.setItem(LS_SEL, defaut);
  }
  return list;
}

export function getCurrencies(): Devise[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LS_LIST);
  return raw ? (JSON.parse(raw) as Devise[]) : [{ code: 'GNF', nom: 'Franc guinéen', symbole: 'FG', tauxGnf: 1 }];
}

export function getSelectedCurrency(): string {
  if (typeof window === 'undefined') return 'GNF';
  return localStorage.getItem(LS_SEL) ?? 'GNF';
}

export function setSelectedCurrency(code: string): void {
  localStorage.setItem(LS_SEL, code);
}

// Convertit un montant exprimé en GNF vers la devise sélectionnée et le formate
export function formatMoney(montantGnf: number, code?: string): string {
  const sel = code ?? getSelectedCurrency();
  const devise = getCurrencies().find((d) => d.code === sel) ?? { code: 'GNF', symbole: 'FG', tauxGnf: 1, nom: '' };
  const taux = Number(devise.tauxGnf) || 1;
  const converti = montantGnf / taux;
  return `${converti.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${devise.symbole}`;
}
