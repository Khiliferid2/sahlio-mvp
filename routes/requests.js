const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { uid, distanceKm } = require('../utils');

const router = express.Router();

// POST /api/requests — client creates a "demande de service"
router.post('/requests', requireAuth, (req, res) => {
  const { service_id, description, lat, lng, address_label } = req.body;
  if (!service_id || !description || lat == null || lng == null) {
    return res.status(400).json({ error: 'الخدمة والوصف والبلاصة مطلوبين' });
  }
  const id = uid();
  db.prepare(
    `INSERT INTO service_requests (id, client_id, service_id, description, request_lat, request_lng, address_label)
     VALUES (?,?,?,?,?,?,?)`
  ).run(id, req.user.id, service_id, description, lat, lng, address_label || null);

  res.json({ id });
});

// GET /api/requests/mine — client's own requests
router.get('/requests/mine', requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT r.*, s.name_ar as service_name,
       (SELECT COUNT(*) FROM offers o WHERE o.request_id = r.id) as offer_count
     FROM service_requests r JOIN services s ON s.id = r.service_id
     WHERE r.client_id = ? ORDER BY r.created_at DESC`
  ).all(req.user.id);
  res.json(rows);
});

// GET /api/requests/nearby — provider sees pending requests within their radius
router.get('/requests/nearby', requireAuth, (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'حساب حرفي فقط' });
  const profile = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  if (!profile.base_lat) return res.json([]); // provider hasn't set a location yet

  const myServiceIds = db.prepare(
    'SELECT service_id FROM provider_services WHERE provider_id = ?'
  ).all(profile.id).map(r => r.service_id);

  if (myServiceIds.length === 0) return res.json([]);

  const placeholders = myServiceIds.map(() => '?').join(',');
  const pending = db.prepare(
    `SELECT r.*, s.name_ar as service_name FROM service_requests r
     JOIN services s ON s.id = r.service_id
     WHERE r.status = 'pending' AND r.service_id IN (${placeholders})`
  ).all(...myServiceIds);

  const nearby = pending
    .map(r => ({ ...r, distance_km: distanceKm(profile.base_lat, profile.base_lng, r.request_lat, r.request_lng) }))
    .filter(r => r.distance_km <= profile.travel_radius_km)
    .sort((a, b) => a.distance_km - b.distance_km);

  res.json(nearby);
});

// GET /api/requests/:id/offers — client views offers on their request
router.get('/requests/:id/offers', requireAuth, (req, res) => {
  const offers = db.prepare(
    `SELECT o.*, u.full_name as provider_name, p.rating_avg, p.rating_count
     FROM offers o
     JOIN providers p ON p.id = o.provider_id
     JOIN users u ON u.id = p.user_id
     WHERE o.request_id = ? ORDER BY o.created_at ASC`
  ).all(req.params.id);
  res.json(offers);
});

// POST /api/requests/:id/offers — provider sends an offer (price + délai)
router.post('/requests/:id/offers', requireAuth, (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'حساب حرفي فقط' });
  const { price, eta_label, message } = req.body;
  if (!price || !eta_label) return res.status(400).json({ error: 'الثمن والمدة مطلوبين' });

  const profile = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(req.params.id);
  if (!reqRow || reqRow.status !== 'pending') {
    return res.status(400).json({ error: 'الطلب ما عادش متاح' });
  }

  const id = uid();
  db.prepare(
    `INSERT INTO offers (id, request_id, provider_id, price, eta_label, message)
     VALUES (?,?,?,?,?,?)`
  ).run(id, req.params.id, profile.id, price, eta_label, message || null);

  res.json({ id });
});

// POST /api/offers/:id/accept — client picks an offer
router.post('/offers/:id/accept', requireAuth, (req, res) => {
  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!offer) return res.status(404).json({ error: 'العرض ماكانش' });

  const reqRow = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(offer.request_id);
  if (reqRow.client_id !== req.user.id) return res.status(403).json({ error: 'ماهوش طلبك' });

  db.prepare('UPDATE offers SET status = ? WHERE id = ?').run('accepted', offer.id);
  db.prepare('UPDATE offers SET status = ? WHERE request_id = ? AND id != ?')
    .run('declined', offer.request_id, offer.id);
  db.prepare('UPDATE service_requests SET status = ?, chosen_offer_id = ? WHERE id = ?')
    .run('matched', offer.id, offer.request_id);

  res.json({ ok: true });
});

// ---- in-app chat (keeps phone numbers private until an offer is accepted) ----

// GET /api/requests/:id/messages
router.get('/requests/:id/messages', requireAuth, (req, res) => {
  const rows = db.prepare(
    `SELECT m.*, u.full_name as sender_name FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.request_id = ? ORDER BY m.created_at ASC`
  ).all(req.params.id);
  res.json(rows);
});

// POST /api/requests/:id/messages
router.post('/requests/:id/messages', requireAuth, (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'الرسالة فارغة' });
  const id = uid();
  db.prepare(
    'INSERT INTO messages (id, request_id, sender_id, body) VALUES (?,?,?,?)'
  ).run(id, req.params.id, req.user.id, body);
  res.json({ id });
});

// ---- reviews ----
router.post('/requests/:id/reviews', requireAuth, (req, res) => {
  const { target_id, rating, comment } = req.body;
  const id = uid();
  db.prepare(
    `INSERT INTO reviews (id, request_id, author_id, target_id, rating, comment)
     VALUES (?,?,?,?,?,?)`
  ).run(id, req.params.id, req.user.id, target_id, rating, comment || null);

  // recompute provider rating average
  const providerProfile = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(target_id);
  if (providerProfile) {
    const stats = db.prepare(
      `SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews
       WHERE target_id = ?`
    ).get(target_id);
    db.prepare('UPDATE providers SET rating_avg = ?, rating_count = ? WHERE id = ?')
      .run(Math.round(stats.avg * 10) / 10, stats.cnt, providerProfile.id);
  }

  res.json({ id });
});

module.exports = router;
