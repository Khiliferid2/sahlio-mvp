const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'sahlio.db'));
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const SERVICES = [
  ['كهرباء', 'Électricien', 'bolt'],
  ['تنظيف', 'Ménage', 'broom'],
  ['سباكة', 'Plombier', 'wrench'],
  ['صباغة', 'Peinture', 'paint'],
  ['جردنة', 'Jardinage', 'leaf'],
  ['نقلان', 'Déménagement', 'truck'],
  ['تكييف', 'Climatisation', 'snowflake'],
  ['تصفيف شعر بالدار', 'Coiffure à domicile', 'scissors'],
  ['دروس خصوصية', 'Cours particuliers', 'book'],
  ['ريبراسيون تليفون', 'Réparation téléphone', 'phone'],
  ['إعلامية', 'Informatique', 'computer'],
  ['ميكانيك سيارات', 'Mécanique auto', 'car'],
  ['نجارة', 'Menuiserie', 'hammer'],
  ['حدادة', 'Ferronnerie', 'tool'],
  ['حراسة وأمن', 'Sécurité / Gardiennage', 'shield'],
];

const existing = new Set(db.prepare('SELECT name_ar FROM services').all().map(r => r.name_ar));
const insert = db.prepare('INSERT INTO services (name_ar, name_fr, icon) VALUES (?,?,?)');
let added = 0;
for (const [ar, fr, icon] of SERVICES) {
  if (!existing.has(ar)) {
    insert.run(ar, fr, icon);
    added++;
  }
}
if (added > 0) console.log(`Seeded ${added} service(s)`);

module.exports = db;
