import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db.js';
import crypto from 'crypto';
import { mailer } from '../lib/mailer.js';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // để false khi chạy http localhost; production https => true
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return res.status(409).json({ error: 'Email already used' });

    const roleRow = await prisma.role.findFirst({ where: { name: 'student' } });
    if (!roleRow) return res.status(400).json({ error: 'Invalid role' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, roleId: roleRow.id },
      include: { role: true },
    });

    const token = signToken(user);
    setAuthCookie(res, token);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role.name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to register' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role.name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to login' });
  }
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { role: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role.name });
}

export function logout(_req, res) {
  res.clearCookie('token');
  res.json({ ok: true });
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const user = await prisma.user.findUnique({ where: { email } });
  // Trả lời mù để tránh lộ thông tin
  if (!user) return res.json({ message: 'If the email exists, a reset link has been sent.' });

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?uid=${user.id}&token=${rawToken}`;
  await mailer.sendMail({
    from: `"NGUEdu Learning Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Đặt lại mật khẩu',
    html: `
      <p>Nhấn vào liên kết sau để đặt lại mật khẩu (hết hạn sau 60 phút):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    `,
  });
  

  res.json({ message: 'If the email exists, a reset link has been sent.' });
}

export async function resetPasswordController(req, res) {
  const { uid, token, newPassword } = req.body;
  if (!uid || !token || !newPassword)
    return res.status(400).json({ error: 'Missing fields' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const record = await prisma.passwordResetToken.findFirst({
    where: { userId: Number(uid), tokenHash, used: false },
  });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: Number(uid) }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  res.json({ message: 'Đặt lại mật khẩu thành công' });
}
