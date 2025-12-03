import { prisma } from '../lib/db.js';

const ALLOWED_REQUESTED_ROLES = ['instructor'];

// POST /api/role-requests
export async function createRoleRequest(req, res) {
  try {
    const userId = req.user.id;
    const { requestedRole = 'instructor', note } = req.body || {};

    if (!ALLOWED_REQUESTED_ROLES.includes(requestedRole)) {
      return res.status(400).json({ error: 'Invalid requestedRole' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent requesting when already in target role/admin
    if (user.role?.name === requestedRole) {
      return res.status(400).json({ error: 'You already have this role' });
    }
    if (user.role?.name === 'admin') {
      return res.status(400).json({ error: 'Admin does not need upgrade' });
    }

    const pending = await prisma.roleRequest.findFirst({
      where: { userId, status: 'PENDING' },
    });
    if (pending) {
      return res.status(409).json({ error: 'You already have a pending request' });
    }

    const reqRow = await prisma.roleRequest.create({
      data: { userId, requestedRole, note: note ?? null },
    });
    return res.status(201).json(reqRow);
  } catch (e) {
    console.error('createRoleRequest failed', e);
    return res.status(500).json({ error: 'Failed to create request' });
  }
}

// GET /api/role-requests/me
export async function listMyRoleRequests(req, res) {
  try {
    const userId = req.user.id;
    const items = await prisma.roleRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json(items);
  } catch (e) {
    console.error('listMyRoleRequests failed', e);
    return res.status(500).json({ error: 'Failed to load requests' });
  }
}
