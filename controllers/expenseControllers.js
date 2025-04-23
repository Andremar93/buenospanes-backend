import Expense from '../models/Expense.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';
import { appendToSheet, modifyRow } from '../googleapi/google.js'
import Invoice from '../models/Invoice.js';

async function editRowInGoogleSheet(sheetName, row, values) {
  return modifyRow(sheetName, row, values)
}

async function addToGoogleSheet(description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, rate) {

  // Crear y guardar el nuevo gasto
  const dateForGoogleSheets = new Date(date);
  const fechaSheets = (dateForGoogleSheets - new Date("1899-12-30")) / (1000 * 60 * 60 * 24);
  const values = [
    description, parseFloat(amountBs), parseFloat(amountDollars), currency, fechaSheets, type, subType ? subType : '', paymentMethod, rate
  ];

  return appendToSheet('gastos', [values], {
    "C": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
    "E": { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } },
    "I": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
  });

}

// Crear un nuevo gasto
export const createExpense = async (expenseData) => {
  try {
    const { description, amount, currency, date, type, subType, paymentMethod, paid } = expenseData;
    let amountBs;
    let amountDollars;

    // Obtener la tasa de cambio para la fecha especificada
    const rate = await getExchangeRateByDate(date);
    if (!rate) {
      return { status: 404, message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}` };
    }

    // Calcular la cantidad en Bs y en dólares
    if (currency === 'Bs') {
      amountBs = amount;
      amountDollars = (amount / rate.rate).toFixed(2);
    } else {
      amountBs = (amount * rate.rate).toFixed(2);
      amountDollars = amount;
    }

    const googleRow = await addToGoogleSheet(description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, rate.rate)
    const newExpense = new Expense({ description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, paid, googleRow });


    await newExpense.save();

    return newExpense;
  } catch (error) {
    console.error('createExpenseFromController Error:', error);
    return { status: 500, message: 'Error interno del servidor' };
  }
};

//Create expenseByInovice
export const createExpenseByInvoice = async (invoiceData) => {
  try {
    const { invoiceId, paymentMethod, date, subType } = invoiceData;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return { status: 404, message: `Factura con ID ${invoiceId} no encontrada` };
    }

    invoice.paid = true;
    await invoice.save();

    const { description, currency, type, googleRow} = invoice;
    let { amountDollars, amountBs } = invoice;

    const rate = await getExchangeRateByDate(date);
    if (!rate) {
      return { status: 404, message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}` };
    }

    if (currency === 'Bs') {
      amountDollars = (amountBs / rate.rate).toFixed(2);
    } else {
      amountBs = (amountDollars * rate.rate).toFixed(2);
    }

    const values = [true];
    const editedInvoice = await editRowInGoogleSheet('facturas', googleRow, values);
    if(!editedInvoice){
      return { status: 500, message: 'No se pudo editar la fila en Google Sheets (facturas)' };
    }
    const googleRowExpense = await addToGoogleSheet(description, amountBs, amountDollars, currency, date, type, subType, paymentMethod, rate.rate);
    if (!googleRowExpense) {
      return { status: 500, message: 'No se pudo registrar el gasto en Google Sheets' };
    }
 
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


