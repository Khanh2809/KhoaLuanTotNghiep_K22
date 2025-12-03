import { prisma } from '../lib/db.js';
import { auditLog } from '../lib/audit.js';

// GET /api/admin/role-requests?status=&page=&pageSize=
export async function adminListRoleRequests(req, res) {
  try {
    const { status, requestedRole, page = '1', pageSize = '20' } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {
      ...(status ? { status } : {}),
      ...(requestedRole ? { requestedRole } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.roleRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.roleRequest.count({ where }),
    ]);

    res.json({ items, pagination: { total, page: Number(page), pageSize: take } });
  } catch (e) {
    console.error('adminListRoleRequests failed', e);
    res.status(500).json({ error: 'Failed to list role requests' });
  }
}

// POST /api/admin/role-requests/:id/approve
export async function adminApproveRoleRequest(req, res) {
  try {
    const id = Number(req.params.id);
    const request = await prisma.roleRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request already processed' });

    const targetRole = await prisma.role.findFirst({ where: { name: request.requestedRole } });
    if (!targetRole) return res.status(400).json({ error: 'Requested role not found' });

    await prisma.$transaction([
      prisma.roleRequest.update({
        where: { id },
        data: { status: 'APPROVED', adminId: req.user.id },
      }),
      prisma.user.update({ where: { id: request.userId }, data: { roleId: targetRole.id } }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          message: 'Yêu cầu trở thành giảng viên đã được chấp thuận',
          type: 'ROLE_REQUEST_APPROVED',
        },
      }),
    ]);

    await auditLog(req, {
      action: 'ROLE_REQUEST.APPROVE',
      targetType: 'user',
      targetId: request.userId,
      meta: { requestId: id, toRole: request.requestedRole },
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('adminApproveRoleRequest failed', e);
    res.status(500).json({ error: 'Failed to approve request' });
  }
}

// POST /api/admin/role-requests/:id/reject
export async function adminRejectRoleRequest(req, res) {
  try {
    const id = Number(req.params.id);
    const { note } = req.body || {};

    const request = await prisma.roleRequest.findUnique({ where: { id } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request already processed' });

    await prisma.$transaction([
      prisma.roleRequest.update({
        where: { id },
        data: { status: 'REJECTED', adminId: req.user.id, note: note ?? null },
      }),
      prisma.notification.create({
        data: {
          userId: request.userId,
          message: 'Yêu cầu trở thành giảng viên đã bị từ chối',
          type: 'ROLE_REQUEST_REJECTED',
        },
      }),
    ]);

    await auditLog(req, {
      action: 'ROLE_REQUEST.REJECT',
      targetType: 'user',
      targetId: request.userId,
      meta: { requestId: id },
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('adminRejectRoleRequest failed', e);
    res.status(500).json({ error: 'Failed to reject request' });
  }
}
