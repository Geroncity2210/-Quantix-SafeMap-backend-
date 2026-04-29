const express = require('express');
const router = express.Router();
const { generarAnalisis } = require('../services/analisis-service.js');

// GET /api/analisis
router.get('/', async (req, res) => {
  try {
    const { observaciones } = await generarAnalisis();
    res.json({
      ok: true,
      generado_en: new Date().toISOString(),
      total: observaciones.length,
      observaciones,
    });
  } catch (error) {
    // Si Gemini devuelve JSON malformado lo capturamos aquí
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        ok: false,
        mensaje: 'Gemini devolvió una respuesta en formato inesperado',
      });
    }
    res.status(500).json({ ok: false, mensaje: error.message });
  }
});

module.exports = router;