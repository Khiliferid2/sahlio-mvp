const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // initializes + seeds the sqlite db on boot

const authRoutes = require('./routes/auth');
const providerRoutes = require('./routes/providers');
const requestRoutes = require('./routes/requests');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', providerRoutes);
app.use('/api', requestRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sahlio MVP running on http://localhost:${PORT}`));
