import Income from '../models/Income.js';
import { appendToSheet, modifyFullRow } from '../googleapi/google.js';
import { getExchangeRateByDate } from './exchangeRateController.js';

async function addToGoogleSheet(
  date,
  totalSistema,
  efectivoBs,
  efectivoDolares,
  puntoExterno,
  pagomovil,
  biopago,
  sitef,
  gastosBs,
  gastosDolares,
  notas,
  rate
) {
  // Crear y guardar el nuevo gasto
  const dateForGoogleSheets = new Date(date);
  const fechaSheets =
    (dateForGoogleSheets - new Date('1899-12-30')) / (1000 * 60 * 60 * 24);

  const values = [
    fechaSheets,
    parseFloat(efectivoBs),
    parseFloat(efectivoDolares),
    parseFloat(sitef),
    parseFloat(puntoExterno),
    parseFloat(pagomovil),
    parseFloat(biopago),
    parseFloat(gastosBs),
    parseFloat(gastosDolares),
    parseFloat(totalSistema),
    notas,
    rate
  ];

  return appendToSheet('ingresos', [values], {
    A: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } },
    B: { numberFormat: { type: 'NUMBER', pattern: '"Bs" #,##0.00' } },
    C: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } },
    D: { numberFormat: { type: 'NUMBER', pattern: '"Bs" #,##0.00' } },
    E: { numberFormat: { type: 'NUMBER', pattern: '"Bs" #,##0.00' } },
    F: { numberFormat: { type: 'NUMBER', pattern: '"Bs" #,##0.00' } },
    G: { numberFormat: { type: 'NUMBER', pattern: '"Bs" #,##0.00' } },
    H: { numberFormat: { type: 'NUMBER', pattern: '"Bs" #,##0.00' } },
    I: { numberFormat: { type: 'NUMBER', pattern: '"Bs" #,##0.00' } },
    J: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } },
    L: { numberFormat: { type: 'NUMBER', pattern: '"Bs" #,##0.00' } }
  });
}

export const getIncomes = async (getData = {}) => {
  try {
    let from, to;

    // Si vienen fechas personalizadas, úsalas
    if (getData.startDate && getData.finishDate) {
      from = new Date(getData.startDate);
      to = new Date(getData.finishDate);
      to.setHours(23, 59, 59, 999); // incluir todo el día final
    } else {
      // Por defecto: últimos 31 días
      to = new Date();
      from = new Date(to);
      from.setDate(to.getDate() - 31);
    }

    const incomes = await Income.find({
      date: { $gte: from, $lte: to }
    }).sort({ date: -1 });

    return {
      from,
      to,
      incomes
    };
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    throw new Error('Error al obtener los ingresos');
  }
};

export const createIncome = async (incomeData) => {
  try {
    const {
      sitef = 0,
      puntoExterno = 0,
      efectivoBs = 0,
      efectivoDolares = 0,
      pagomovil = 0,
      biopago = 0,
      gastosBs = 0,
      gastosDolares = 0,
      totalSistema = 0,
      notas = '',
      date
    } = incomeData;

    const rateAsync = await getExchangeRateByDate(date);
    if (!rateAsync) {
      throw {
        status: 404,
        message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}`
      };
    }
    const rate = rateAsync.rate;

    // Buscar si ya hay ingreso con esa fecha
    const existingIncome = await Income.findOne({
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lte: new Date(date).setHours(23, 59, 59, 999)
      }
    });

    if (existingIncome) {
      // Sumar valores nuevos a los existentes
      const updatedData = {
        sitef: existingIncome.sitef + sitef,
        puntoExterno: existingIncome.puntoExterno + puntoExterno,
        efectivoBs: existingIncome.efectivoBs + efectivoBs,
        efectivoDolares: existingIncome.efectivoDolares + efectivoDolares,
        pagomovil: existingIncome.pagomovil + pagomovil,
        biopago: existingIncome.biopago + biopago,
        gastosBs: existingIncome.gastosBs + gastosBs,
        gastosDolares: existingIncome.gastosDolares + gastosDolares,
        totalSistema: existingIncome.totalSistema + totalSistema,
        notas:
          (existingIncome.notas ? existingIncome.notas + '\n' : '') + notas,
        date
      };

      // Usar tu función ya existente
      return await updateIncome(existingIncome._id, updatedData);
    } else {
      // Si no existe, registrar normalmente
      const googleRow = await addToGoogleSheet(
        date,
        totalSistema,
        efectivoBs,
        efectivoDolares,
        puntoExterno,
        pagomovil,
        biopago,
        sitef,
        gastosBs,
        gastosDolares,
        notas,
        rate
      );

      if (!googleRow) {
        throw {
          status: 500,
          message: 'No se pudo registrar el ingreso en Google Sheets'
        };
      }

      const newIncome = new Income({
        sitef,
        puntoExterno,
        efectivoBs,
        efectivoDolares,
        pagomovil,
        biopago,
        gastosBs,
        gastosDolares,
        totalSistema,
        notas,
        date,
        googleRow,
        rate
      });

      await newIncome.save();
      return newIncome;
    }
  } catch (error) {
    if (error.status) throw error;

    console.error('createIncome Error:', error);
    throw { status: 500, message: 'Error interno del servidor' };
  }
};

export const updateIncome = async (incomeId, income) => {
  try {
    const {
      sitef,
      puntoExterno,
      efectivoBs,
      efectivoDolares,
      pagomovil,
      biopago,
      gastosBs,
      gastosDolares,
      totalSistema,
      notas,
      date
    } = income;

    const incomeInDatabase = await Income.findById(incomeId);
    if (!incomeInDatabase) {
      throw {
        status: 404,
        message: `Factura con ID ${incomeId} no encontrada`
      };
    }

    const rateAsync = await getExchangeRateByDate(date);
    if (!rateAsync) {
      throw {
        status: 404,
        message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}`
      };
    }

    const rate = rateAsync.rate;
    const googleRow = incomeInDatabase.googleRow;

    const editedIncome = await modifyFullRow('ingresos', googleRow, [
      date,
      efectivoBs,
      efectivoDolares,
      sitef,
      puntoExterno,
      pagomovil,
      biopago,
      gastosBs,
      gastosDolares,
      totalSistema,
      notas,
      googleRow,
      rate
    ]);
    if (!editedIncome) {
      throw {
        status: 500,
        message: 'No se pudo editar la fila en Google Sheets (ingresos)'
      };
    }

    const updatedIncome = await Income.findByIdAndUpdate(
      incomeId,
      {
        date,
        efectivoBs,
        efectivoDolares,
        sitef,
        puntoExterno,
        pagomovil,
        biopago,
        gastosBs,
        gastosDolares,
        totalSistema,
        notas,
        googleRow,
        rate,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!updatedIncome) {
      throw { status: 400, message: 'No se encontro la factura.' };
    }

    return updatedIncome;
  } catch (error) {
    // Si ya es un error lanzado manualmente, lo re-lanzamos
    if (error.status) throw error;

    // Si es un error inesperado, lo manejamos como interno
    console.error('createIncome Error:', error);
    throw { status: 500, message: 'Error interno del servidor' };
  }
};
