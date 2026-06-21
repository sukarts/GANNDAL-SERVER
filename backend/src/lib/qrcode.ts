import QRCode from 'qrcode';
import { uploadObject } from './s3.js';

// Génère un QR Code pointant vers la fiche matériel et le stocke sur S3
export async function genererQrMateriel(materielId: string, ficheUrl: string): Promise<{ data: string; url: string }> {
  const png = await QRCode.toBuffer(ficheUrl, { type: 'png', width: 512, margin: 2 });
  const key = `qrcodes/materiel-${materielId}.png`;
  const url = await uploadObject(key, png, 'image/png');
  return { data: ficheUrl, url };
}
