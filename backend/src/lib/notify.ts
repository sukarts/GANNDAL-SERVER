import { prisma } from './prisma.js';
import { sendEmail } from './mailer.js';
import { env } from '../config/env.js';
import type { CanalNotif } from '@prisma/client';

interface NotifInput {
  userId: string;
  titre: string;
  message: string;
  lien?: string;
  canaux?: CanalNotif[]; // défaut: INTERNE
}

// Normalise un numéro au format E.164 sans '+' (attendu par l'API WhatsApp)
function normalisePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

// Envoi WhatsApp via Meta Cloud API (log en dev si non configuré)
async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!env.whatsapp.token || !env.whatsapp.phoneId) {
    console.log(`[whatsapp:dev] -> ${phone} | ${message}`);
    return;
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${env.whatsapp.phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalisePhone(phone),
        type: 'text',
        text: { body: message },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[whatsapp] échec ${res.status}: ${detail}`);
    }
  } catch (e) {
    // Ne jamais casser le flux métier si WhatsApp échoue
    console.error('[whatsapp] erreur réseau', e);
  }
}

export async function notify(input: NotifInput): Promise<void> {
  const canaux = input.canaux ?? ['INTERNE'];
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return;

  for (const canal of canaux) {
    if (canal === 'INTERNE') {
      await prisma.notification.create({
        data: {
          userId: input.userId,
          canal,
          titre: input.titre,
          message: input.message,
          lien: input.lien,
        },
      });
    } else if (canal === 'EMAIL') {
      await sendEmail(user.email, input.titre, `<p>${input.message}</p>`);
    } else if (canal === 'WHATSAPP' && user.telephone) {
      await sendWhatsApp(user.telephone, `${input.titre}\n${input.message}`);
    }
  }
}
