const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database(path.join(__dirname, 'sahlio.db'));
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// seed services once
const count = db.prepare('SELECT COUNT(*) AS c FROM services').get().c;
if (count === 0) {
  const insert = db.prepare('INSERT INTO services (name_ar, name_fr, icon) VALUES (?,?,?)');
  insert.run('كهرباء', 'Électricien', 'bolt');
  insert.run('تنظيف', 'Ménage', 'broom');
  insert.run('سباكة', 'Plombier', 'wrench');
  insert.run('صباغة', 'Peinture', 'paint');
  console.log('Seeded default services');
}

module.exports = db;
