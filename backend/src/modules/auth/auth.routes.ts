import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, unauthorized, badRequest } from '../../lib/http.js';
import { signAccessToken, signRefreshToken, verifyRefresh } from '../../lib/jwt.js';
import { authenticate } from '../../middleware/auth.js';
import { audit } from '../../lib/audit.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.actif) throw unauthorized('Identifiants invalides');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw unauthorized('Identifiants invalides');

    const payload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });
    await audit({ userId: user.id, action: 'LOGIN', entite: 'User', entiteId: user.id, ip: req.ip });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role },
    });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = z.object({ refreshToken: z.string() }).parse(req.body).refreshToken;
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) throw unauthorized('Refresh invalide');
    const payload = verifyRefresh(token);
    res.json({ accessToken: signAccessToken({ sub: payload.sub, role: payload.role, email: payload.email }) });
  }),
);

authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const token = (req.body?.refreshToken as string) ?? '';
    if (token) await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
    res.json({ ok: true });
  }),
);

// Mise à jour de son propre profil (champs non sensibles)
const profilSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  telephone: z.string().optional(),
});

authRouter.patch(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = profilSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user!.sub }, data });
    await audit({ userId: user.id, action: 'UPDATE', entite: 'User', entiteId: user.id, details: { profil: data }, ip: req.ip });
    const { passwordHash, ...safe } = user;
    res.json(safe);
  }),
);

const changePwdSchema = z.object({
  ancienMotDePasse: z.string().min(1),
  nouveauMotDePasse: z.string().min(6),
});

authRouter.post(
  '/change-password',
  authenticate,
  asyncHandler(async (req, res) => {
    const { ancienMotDePasse, nouveauMotDePasse } = changePwdSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user) throw unauthorized();
    const ok = await bcrypt.compare(ancienMotDePasse, user.passwordHash);
    if (!ok) throw badRequest('Ancien mot de passe incorrect');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(nouveauMotDePasse, 10) },
    });
    // Révoque toutes les sessions existantes (refresh tokens)
    await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } });
    await audit({ userId: user.id, action: 'CHANGE_PASSWORD', entite: 'User', entiteId: user.id, ip: req.ip });
    res.json({ ok: true });
  }),
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { jriProfile: true },
    });
    if (!user) throw badRequest('Utilisateur introuvable');
    const { passwordHash, ...safe } = user;
    res.json(safe);
  }),
);
