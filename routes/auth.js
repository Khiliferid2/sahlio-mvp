const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { uid, makeToken } = require('../utils');

const router = express.Router();

// POST /api/auth/register  { full_name, phone, password, role }
router.post('/register', (req, res) => {
  const { full_name, phone, password, role } = req.body;
  if (!full_name || !phone || !password) {
    return res.status(400).json({ error: 'الاسم والهاتف وكلمة السر مطلوبين' });
  }
  const exists = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (exists) return res.status(409).json({ error: 'رقم الهاتف مسجل من قبل' });

  const id = uid();
  const password_hash = bcrypt.hashSync(password, 10);
  const finalRole = role === 'provider' ? 'provider' : 'client';

  db.prepare(
    'INSERT INTO users (id, phone, full_name, password_hash, role) VALUES (?,?,?,?,?)'
  ).run(id, phone, full_name, password_hash, finalRole);

  if (finalRole === 'provider') {
    db.prepare(
      'INSERT INTO providers (id, user_id) VALUES (?,?)'
    ).run(uid(), id);
  }

  const token = makeToken(id);
  res.json({ token, user: { id, full_name, phone, role: finalRole } });
});

// POST /api/auth/login  { phone, password }
router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'رقم الهاتف أو كلمة السر غالطة' });
  }
  const token = makeToken(user.id);
  res.json({
    token,
    user: { id: user.id, full_name: user.full_name, phone: user.phone, role: user.role }
  });
});

module.exports = router;
