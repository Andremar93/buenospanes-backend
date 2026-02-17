import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';
import {
  appendToSheet,
  modifyPaidValue,
  modifyFullRow
} from '../googleapi/google.js';
import { calculateAmounts } from '../helpers/currencyHelpers.js';
import { formatDateForSheets } from '../helpers/dateHelpers.js';

async function addExpenseToSheet({
  description,
  amountBs,
  amountDollars,
  currency,
  date,
  type,
  subType,
  paymentMethod,
  rate
}) {
  const values = [
    description,
    parseFloat(amountBs),
    parseFloat(amountDollars),
    currency,
    formatDateForSheets(date),
    type,
    subType || '',
    paymentMethod,
    rate
  ];

  return appendToSheet('gastos', [values], {
    C: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } },
    E: { numberFormat: { type: 'DATE', pattern: 'yyyy-mm-dd' } },
    I: { numberFormat: { type: 'CURRENCY', pattern: '$#,##0.00' } }
  });
}

export const createExpense = async (expenseData) => {
  const {
    description,
    amount,
    currency,
    date,
    type,
    subType,
    paymentMethod,
    paid
  } = expenseData;

  const rate = await getExchangeRateByDate(date);

  if (!rate) {
    const error = new Error(
      `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}`
    );
    error.status = 404;
    throw error;
  }

  const { amountBs, amountDollars } = calculateAmounts(
    amount,
    currency,
    rate.rate
  );

  const googleRow = await addExpenseToSheet({
    description,
    amountBs,
    amountDollars,
    currency,
    date,
    type,
    subType,
    paymentMethod,
    rate: rate.rate
  });

  if (!googleRow) {
    const error = new Error(
      'No se pudo registrar el gasto en Google Sheets'
    );
    error.status = 500;
    throw error;
  }

  const newExpense = new Expense({
    description,
    amountBs,
    amountDollars,
    currency,
    date,
    type,
    subType,
    paymentMethod,
    paid,
    googleRow
  });

  await newExpense.save();

  return newExpense;
};


export const createExpenseByInvoice = async (invoiceData) => {
  try {
    const { id: invoiceId, paymentMethod, date, subType } = invoiceData.invoiceId;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return {
        status: 404,
        message: `Factura con ID ${invoiceId} no encontrada`
      };
    }

    const { description, currency, type, googleRow } = invoice;
    let { amountDollars, amountBs } = invoice;

    const rate = await getExchangeRateByDate(date);
    if (!rate) {
      return {
        status: 404,
        message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}`
      };
    }

    const baseAmount = currency === 'Bs' ? amountBs : amountDollars;
    ({ amountBs, amountDollars } = calculateAmounts(
      baseAmount,
      currency,
      rate.rate
    ));

    const editedInvoice = await modifyPaidValue('facturas', googleRow, [true]);
    if (!editedInvoice) {
      return {
        status: 500,
        message: 'No se pudo editar la fila en Google Sheets (facturas)'
      };
    }

    const googleRowExpense = await addExpenseToSheet({
      description,
      amountBs,
      amountDollars,
      currency,
      date,
      type,
      subType,
      paymentMethod,
      invoiceId,
      rate: rate.rate
    });

    if (!googleRowExpense) {
      return {
        status: 500,
        message: 'No se pudo registrar el gasto en Google Sheets'
      };
    }

    invoice.paid = true;
    await invoice.save();

    const newExpense = new Expense({
      description,
      amountBs,
      amountDollars,
      currency,
      date,
      type,
      paymentMethod,
      paid: true,
      googleRow: googleRowExpense,
      subType
    });

    await newExpense.save();
    console.log(newExpense);
    return newExpense;
  } catch (error) {
    console.error('createExpenseByInvoice Error:', error);
    return { status: 500, message: 'Error interno del servidor' };
  }
};

export const updateExpenseById = async (expenseId, updateData) => {
  if (updateData._id) delete updateData._id;

  // Opcional: asegurar que 'date' sea Date
  // if (updateData.date) updateData.date = new Date(updateData.date);

  const expenseInDatabase = await Expense.findById(expenseId);
  if (!expenseInDatabase) {
    throw { status: 404, message: `Factura con ID ${expenseId} no encontrada` };
  }

  const rateAsync = await getExchangeRateByDate(updateData.date);
  if (!rateAsync) {

    const error = new Error(
      `No existe tasa de cambio para la fecha ${new Date(updateData.date).toLocaleDateString()}`
    );
    error.status = 404;
    throw error;
  }

  const rate = rateAsync.rate;

  const { amountBs, amountDollars } = calculateAmounts(
    updateData.amount,
    updateData.currency,
    rate
  );

  const googleRow = expenseInDatabase.googleRow;

  const { description, currency, date, type, subType, paymentMethod } =
    updateData;

  const editedExpense = await modifyFullRow('gastos', googleRow, [
    description,
    amountBs,
    amountDollars,
    currency,
    date,
    type,
    subType,
    paymentMethod,
    rate
  ]);
  if (!editedExpense) {
    throw {
      status: 500,
      message: 'No se pudo editar la fila en Google Sheets (gastos)'
    };
  }

  const updatePayload = {
    ...updateData,
    amountBs,
    amountDollars
  };

  const updatedExpense = await Expense.findByIdAndUpdate(
    expenseId,
    updatePayload,
    {
      new: true,
      runValidators: true
    }
  );

  console.log(updateData, updatedExpense)

  if (!updatedExpense) {
    throw { status: 404, message: 'Gasto no encontrado' };
  }
  return updatedExpense;
};

export const getExpenses = async (getData = {}) => {
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

    const expenses = await Expense.find({
      date: { $gte: from, $lte: to }
    }).sort({ date: -1 });

    return {
      from,
      to,
      expenses
    };
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    throw new Error('Error al obtener los gastos');
  }
};
