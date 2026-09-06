const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/services
router.get('/services', (req, res) => {
  const services = db.prepare('SELECT * FROM services').all();
  res.json(services);
});

// GET /api/providers/me — provider's own profile
router.get('/providers/me', requireAuth, (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'حساب حرفي فقط' });
  const profile = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  const services = db.prepare(
    `SELECT ps.service_id, s.name_ar, s.name_fr, ps.price_hint
     FROM provider_services ps JOIN services s ON s.id = ps.service_id
     WHERE ps.provider_id = ?`
  ).all(profile.id);
  res.json({ ...profile, services });
});

// PUT /api/providers/me — set location, radius, bio
router.put('/providers/me', requireAuth, (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'حساب حرفي فقط' });
  const { base_lat, base_lng, travel_radius_km, bio } = req.body;
  db.prepare(
    `UPDATE providers SET base_lat = ?, base_lng = ?, travel_radius_km = ?, bio = ?
     WHERE user_id = ?`
  ).run(base_lat, base_lng, travel_radius_km || 10, bio || null, req.user.id);
  res.json({ ok: true });
});

// POST /api/providers/me/services — add/update a service this provider offers
router.post('/providers/me/services', requireAuth, (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: 'حساب حرفي فقط' });
  const { service_id, price_hint } = req.body;
  const profile = db.prepare('SELECT * FROM providers WHERE user_id = ?').get(req.user.id);
  db.prepare(
    `INSERT INTO provider_services (provider_id, service_id, price_hint)
     VALUES (?,?,?)
     ON CONFLICT(provider_id, service_id) DO UPDATE SET price_hint = excluded.price_hint`
  ).run(profile.id, service_id, price_hint || null);
  res.json({ ok: true });
});

// GET /api/providers/public — public directory of active providers (no auth needed)
router.get('/providers/public', (req, res) => {
  const rows = db.prepare(
    `SELECT u.full_name, p.rating_avg, p.rating_count, p.bio,
       GROUP_CONCAT(s.name_ar, '، ') as services
     FROM providers p
     JOIN users u ON u.id = p.user_id
     LEFT JOIN provider_services ps ON ps.provider_id = p.id
     LEFT JOIN services s ON s.id = ps.service_id
     WHERE p.base_lat IS NOT NULL
     GROUP BY p.id
     ORDER BY p.rating_avg DESC, p.rating_count DESC`
  ).all();
  res.json(rows);
});

module.exports = router;
