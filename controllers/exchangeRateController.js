import ExchangeRate from '../models/ExchangeRate.js';
import { getBcvRateSafe } from "../helpers/getBcvRate.js";

/**
 * Obtiene tasa BCV para una fecha desde la API y la guarda si no existe.
 * @param {string} dateStr - Fecha en formato "YYYY-MM-DD"
 * @returns {Promise<{ rate: number, date: Date }|null>} - Documento guardado o null si falla
 */
export const fetchAndSaveBcvRateForDate = async (dateStr) => {
  const targetDate = new Date(dateStr);
  // targetDate.setHours(0, 0, 0, 0);


  const existing = await ExchangeRate.findOne({
    date: { $gte: targetDate, $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) },
  });

  if (existing) {
    return existing;
  }

  const rate = await getBcvRateSafe(targetDate);
  const saved = await ExchangeRate.create({
    rate,
    date: targetDate,
  });
  return saved;
};

/**
 * Obtiene tasa BCV (hoy o por fecha) y la guarda si no existe
 * body opcional: { date: "YYYY-MM-DD" }
 */
export const fetchAndSaveBcvRate = async (req, res) => {
  try {
    let { date } = req.body;

    let dateStr = date
      ? (date instanceof Date ? date.toISOString().split('T')[0] : date)
      : new Date().toISOString().split('T')[0];

    const existing = await ExchangeRate.findOne({
      date: {
        $gte: new Date(dateStr),
        $lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existing) {
      return res.json({
        message: "La tasa ya existe para esta fecha",
        rate: existing.rate,
        date: existing.date,
      });
    }

    const saved = await fetchAndSaveBcvRateForDate(dateStr);

    res.json({
      message: "Tasa BCV guardada correctamente",
      rate: saved.rate,
      date: saved.date,
    });
  } catch (error) {
    console.error("BCV Controller Error:", error.message);

    res.status(500).json({
      message: "No se pudo obtener/guardar la tasa BCV",
    });
  }
};

// Crear una nueva tasa
export const createExchangeRate = async (rate, date) => {
  try {
    const exchangeRate = new ExchangeRate({
      rate,
      date
    });

    await exchangeRate.save();
    return exchangeRate;
  } catch (error) {
    throw { status: 500, message: 'Error al crear la tasa de cambio', error };
  }
};

// Obtener la tasa de cambio para una fecha específica
export const getExchangeRateByDate = async (date) => {
  try {
    const requestedDate = new Date(date);
    const formattedDate = requestedDate.toISOString().split('T')[0]; // Obtiene solo YYYY-MM-DD
    const rate = await ExchangeRate.findOne({
      $expr: {
        $eq: [
          { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          formattedDate
        ]
      }
    });

    return rate || null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
