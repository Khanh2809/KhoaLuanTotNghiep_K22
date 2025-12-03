// controllers/admin.logs.controller.js
import { prisma } from '../lib/db.js';
// GET /api/admin/logs?q=&action=&page=&pageSize=
export async function adminListLogs(req, res) {
  try {
    const { q, action, page='1', pageSize='50' } = req.query;
    const take = Math.min(parseInt(pageSize,10)||50, 200);
    const skip = (Math.max(parseInt(page,10)||1,1)-1)*take;

    const where = {
      ...(action ? { action } : {}),
      ...(q ? { OR: [
        { action:    { contains: q, mode: 'insensitive' } },
        { targetType:{ contains: q, mode: 'insensitive' } },
      ] } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take, orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true, createdAt: true, action: true, targetType: true, targetId: true, ip: true, ua: true, meta: true,
          actor: { select: { id: true, name: true, email: true } },
        }
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ items, pagination: { total, page: Number(page), pageSize: take }});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list logs' });
  }
}
