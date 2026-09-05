const db = require('../db');
const { tokenToUserId } = require('../utils');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  const userId = tokenToUserId(token);
  if (!userId) return res.status(401).json({ error: 'غير مسجل الدخول' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(401).json({ error: 'مستخدم غير موجود' });

  req.user = user;
  next();
}

module.exports = { requireAuth };
