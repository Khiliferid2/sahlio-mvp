const crypto = require('crypto');

function uid() {
  return crypto.randomUUID();
}

// Haversine distance in km between two lat/lng points
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// very simple auth: token = base64(userId). NOT production-grade — swap for JWT + real
// session handling before going live. Good enough to test the product flow end to end.
function makeToken(userId) {
  return Buffer.from(userId).toString('base64');
}
function tokenToUserId(token) {
  try { return Buffer.from(token, 'base64').toString('utf8'); }
  catch { return null; }
}

module.exports = { uid, distanceKm, makeToken, tokenToUserId };
