import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';
import { appendToSheet, modifyRow } from '../googleapi/google.js'
import { calculateAmounts } from '../helpers/currencyHelpers.js';
import { formatDateForSheets } from '../helpers/dateHelpers.js';

async function addExpenseToSheet({ description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, rate }) {
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
    "C": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
    "E": { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } },
    "I": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
  });
}

export const createExpense = async (expenseData) => {
  try {
    const { description, amount, currency, date, type, subType, paymentMethod, paid } = expenseData;

    const rate = await getExchangeRateByDate(date);
    if (!rate) {
      return { status: 404, message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}` };
    }

    const { amountBs, amountDollars } = calculateAmounts(amount, currency, rate.rate);

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
      return { status: 500, message: 'No se pudo registrar el gasto en Google Sheets' };
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
  } catch (error) {
    console.error('createExpense Error:', error);
    return { status: 500, message: 'Error interno del servidor' };
  }
};


export const createExpenseByInvoice = async (invoiceData) => {
  try {
    const { invoiceId, paymentMethod, date, subType } = invoiceData;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { status: 404, message: `Factura con ID ${invoiceId} no encontrada` };
    }

    const { description, currency, type, googleRow } = invoice;
    let { amountDollars, amountBs } = invoice;

    const rate = await getExchangeRateByDate(date);
    if (!rate) {
      return { status: 404, message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}` };
    }

    const baseAmount = currency === 'Bs' ? amountBs : amountDollars;
    ({ amountBs, amountDollars } = calculateAmounts(baseAmount, currency, rate.rate));

    const editedInvoice = await modifyRow('facturas', googleRow, [true]);
    if (!editedInvoice) {
      return { status: 500, message: 'No se pudo editar la fila en Google Sheets (facturas)' };
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
      rate: rate.rate
    });

    if (!googleRowExpense) {
      return { status: 500, message: 'No se pudo registrar el gasto en Google Sheets' };
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
    return newExpense;

  } catch (error) {
    console.error('createExpenseByInvoice Error:', error);
    return { status: 500, message: 'Error interno del servidor' };
  }
};

