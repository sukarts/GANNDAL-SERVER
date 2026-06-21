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

// Envoi WhatsApp via Cloud API (stub si non configuré)
async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!env.whatsapp.token || !env.whatsapp.phoneId) {
    console.log(`[whatsapp:dev] -> ${phone} | ${message}`);
    return;
  }
  // TODO: appel réel Graph API
  // await fetch(`https://graph.facebook.com/v20.0/${env.whatsapp.phoneId}/messages`, {...})
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
