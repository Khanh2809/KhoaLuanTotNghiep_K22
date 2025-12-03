// lib/audit.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export async function auditLog(req, { action, targetType, targetId, meta }) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id ?? null,
        action, targetType, targetId,
        ip: req.ip, ua: req.headers['user-agent'] || null,
        meta: meta ?? {},
      },
    });
  } catch (e) { console.error('auditLog failed', e); }
}
