require('dotenv').config();
const express = require('express');
const cors = require('cors');
const analisisRoutes = require('./routes/analisis-routes.js');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/analisis', analisisRoutes);

// Healthcheck
app.get('/', (req, res) => res.json({ ok: true, mensaje: 'VialSafe API corriendo' }));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});