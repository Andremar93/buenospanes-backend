import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';
import { appendToSheet } from '../googleapi/google.js';
import { calculateAmounts } from '../helpers/currencyHelpers.js';
import { formatDateForSheets } from '../helpers/dateHelpers.js';


function getUtcMinus4Date() {
    const now = new Date();
    // Resta 4 horas (en milisegundos)
    const utcMinus4 = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    return new Date(utcMinus4.getFullYear(), utcMinus4.getMonth(), utcMinus4.getDate());
}

async function addToGoogleSheet(dueDate, supplier, numeroFactura, type, currency, description, amountDollars, amountBs, rate) {

    const values = [
        description,
        numeroFactura,
        parseFloat(amountBs),
        parseFloat(amountDollars),
        currency,
        formatDateForSheets(new Date()),
        formatDateForSheets(dueDate),
        type, supplier, rate.rate, false
    ];

    return appendToSheet('facturas', [values], {
        "D": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
        "F": { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } },
        "G": { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } },
        "J": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
    });
}
// Crear un nuevo gasto
export const createInvoice = async (invoiceData) => {
    try {
        const { dueDate, supplier, type, amount, currency, numeroFactura } = invoiceData;

        // Validaciones básicas
        if (!dueDate || !supplier || !amount || !currency || !type) {
            return { status: 400, message: 'Datos incompletos para crear la factura.' };
        }


        const date = getUtcMinus4Date();
        const rate = await getExchangeRateByDate(new Date(date));
        if (!rate) {
            throw new Error(`No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}`);
        }        

        const { amountBs, amountDollars } = calculateAmounts(amount, currency, rate.rate);

        const description = `${supplier} #${numeroFactura || ''}`;

        const googleRow = await addToGoogleSheet(dueDate, supplier, numeroFactura, type, currency, description, amountDollars, amountBs, rate)

        if (!googleRow) {
            // Falló la inserción en Google Sheets, no guardar en DB
            return { status: 500, message: 'Error al guardar en Google Sheets. No se guardó la factura.' };
        }

        const newInvoice = new Invoice({
            supplier,
            dueDate,
            type,
            amountBs,
            amountDollars,
            currency,
            description,
            date: new Date(),
            paid: false,
            googleRow,
            numeroFactura
        });

        await newInvoice.save();

        return newInvoice;
    } catch (error) {
        console.error('createInoviceFromController Error:', error);
        return { status: 500, message: 'Error interno del servidor' };
    }
};