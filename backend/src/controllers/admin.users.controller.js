// controllers/admin.users.controller.js
import bcrypt from 'bcryptjs';
import { auditLog } from '../lib/audit.js';
import { prisma } from '../lib/db.js';
/* ========== LIST + SET ROLE ========== */

// GET /api/admin/roles
export async function adminListRoles(_req, res) {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
    res.json(roles);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list roles' });
  }
}

// GET /api/admin/users?q=&role=&page=&pageSize=
export async function adminListUsers(req, res) {
  try {
    const { q, role, page = '1', pageSize = '20' } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {
      ...(role ? { role: { name: role } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: { select: { name: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const normalized = items.map((u) => ({ ...u, role: u.role?.name ?? null }));
    res.json({ items: normalized, pagination: { total, page: Number(page), pageSize: take } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list users' });
  }
}

// PUT /api/admin/users/:id/role { role: 'student'|'instructor'|'admin' }
export async function adminSetUserRole(req, res) {
  try {
    const id = Number(req.params.id);
    const { role } = req.body || {};
    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const roleRow = await prisma.role.findFirst({ where: { name: role } });
    if (!roleRow) return res.status(400).json({ error: 'Role not found' });

    const upd = await prisma.user.update({
      where: { id },
      data: { roleId: roleRow.id },
      select: { id: true, role: { select: { name: true } } },
    });

    await auditLog(req, {
      action: 'USER.ROLE_SET',
      targetType: 'user',
      targetId: id,
      meta: { role },
    });

    res.json({ id: upd.id, role: upd.role?.name ?? role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to set role' });
  }
}

/* ========== ADMIN CRUD USERS ========== */

// POST /api/admin/users
// body: { name, email, password, role }
export async function adminCreateUser(req, res) {
  try {
    const { name, email, password, role = 'student' } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email/password required' });

    const roleRow = await prisma.role.findFirst({ where: { name: role } });
    if (!roleRow) return res.status(400).json({ error: 'Invalid role' });

    const hash = await bcrypt.hash(String(password), 10);
    const u = await prisma.user.create({
      data: { name: name ?? null, email, passwordHash: hash, roleId: roleRow.id },
      select: { id: true, name: true, email: true, role: { select: { name: true } } },
    });

    await auditLog(req, {
      action: 'USER.CREATE',
      targetType: 'user',
      targetId: u.id,
      meta: { email, role },
    });

    res.status(201).json({ ...u, role: u.role?.name ?? role });
  } catch (e) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    console.error(e);
    res.status(500).json({ error: 'Create user failed' });
  }
}

// PUT /api/admin/users/:id
// body: { name?, email?, password?, role? }
export async function adminUpdateUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, email, password, role } = req.body || {};

    /** @type {any} */
    const data = {};
    if (typeof name === 'string') data.name = name;
    if (typeof email === 'string') data.email = email;
    if (typeof role === 'string') {
      const roleRow = await prisma.role.findFirst({ where: { name: role } });
      if (!roleRow) return res.status(400).json({ error: 'Invalid role' });
      data.roleId = roleRow.id;
    }
    if (typeof password === 'string' && password.length > 0) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const u = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: { select: { name: true } } },
    });

    await auditLog(req, {
      action: 'USER.UPDATE',
      targetType: 'user',
      targetId: id,
      meta: { fields: Object.keys(data) },
    });

    res.json({ ...u, role: u.role?.name ?? role });
  } catch (e) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    console.error(e);
    res.status(500).json({ error: 'Update user failed' });
  }
}

// DELETE /api/admin/users/:id
export async function adminDeleteUser(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.user.delete({ where: { id } });

    await auditLog(req, { action: 'USER.DELETE', targetType: 'user', targetId: id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Delete user failed' });
  }
}
