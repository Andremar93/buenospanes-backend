import ExchangeRate from '../models/ExchangeRate.js';

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
