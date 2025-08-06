import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';
import { appendToSheet, eraseRow, modifyFullRow } from '../googleapi/google.js';
import { calculateAmounts } from '../helpers/currencyHelpers.js';
import { formatDateForSheets } from '../helpers/dateHelpers.js';

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

async function eraseInGoogleSheet(googleRow) {
    return eraseRow('facturas', googleRow);
}
// Crear un nuevo gasto
export const createInvoice = async (invoiceData) => {
    try {
        const { dueDate, supplier, type, amount, currency, numeroFactura, date } = invoiceData;

        if (!dueDate || !supplier || !amount || !currency || !type || !date || !numeroFactura) {
            throw { status: 400, message: 'Datos incompletos para crear la factura.' };
        }

        // ✅ Validación de número de factura duplicado
        const existingInvoice = await Invoice.findOne({ numeroFactura });
        if (existingInvoice) {
            throw {
                status: 409,
                message: `Ya existe una factura con el número ${numeroFactura}.`
            };
        }

        const rate = await getExchangeRateByDate(date);
        if (!rate) {
            throw {
                status: 404,
                message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}`
            };
        }

        const { amountBs, amountDollars } = calculateAmounts(amount, currency, rate.rate);
        const description = `${supplier} #${numeroFactura || ''}`;

        const googleRow = await addToGoogleSheet(
            dueDate, supplier, numeroFactura, type, currency, description, amountDollars, amountBs, rate
        );

        if (!googleRow) {
            throw { status: 500, message: 'Error al guardar en Google Sheets. No se guardó la factura.' };
        }

        const newInvoice = new Invoice({
            supplier,
            dueDate,
            type,
            amountBs,
            amountDollars,
            currency,
            description,
            date,
            paid: false,
            googleRow,
            numeroFactura
        });

        await newInvoice.save();
        return newInvoice;

    } catch (error) {
        console.log(error, 'error')
        if (error.status) throw error;
        console.error('createInvoice Error:', error);
        throw { status: 500, message: 'Error interno del servidor' };
    }
};

export const deleteInvoice = async (invoiceId) => {
    try {

        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
            throw { status: 400, message: 'No se encontro la factura.' };
        }

        const erasedGoogleRow = await eraseInGoogleSheet(invoice.googleRow)

        if (erasedGoogleRow.status == 200) {
            return await Invoice.findByIdAndDelete(invoiceId);
        }

    } catch (error) {
        // Si ya es un error lanzado manualmente, lo re-lanzamos
        if (error.status) throw error;

        // Si es un error inesperado, lo manejamos como interno
        console.error('createInvoice Error:', error);
        throw { status: 500, message: 'Error interno del servidor' };
    }
};

export const updateInvoice = async (invoiceId, invoice) => {
    try {

        const
            { supplier,
                dueDate,
                type,
                amount,
                currency,
                date,
                numeroFactura } = invoice

        const invoiceInDatabase = await Invoice.findById(invoiceId);
        if (!invoiceInDatabase) {
            return { status: 404, message: `Factura con ID ${invoiceId} no encontrada` };
        }

        const rate = await getExchangeRateByDate(date);
        if (!rate) {
            throw {
                status: 404,
                message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}`
            };
        }

        const { amountBs, amountDollars } = calculateAmounts(amount, currency, rate.rate);
        const description = `${supplier} #${numeroFactura || ''}`;
        console.log(invoiceInDatabase.googleRow, 'googleRow')
        const editedInvoice = await modifyFullRow('facturas', invoiceInDatabase.googleRow,
            [description,
                numeroFactura,
                parseFloat(amountBs),
                parseFloat(amountDollars),
                currency,
                formatDateForSheets(date),
                formatDateForSheets(dueDate),
                type, supplier, rate.rate, false]
        );
        if (!editedInvoice) {
            return { status: 500, message: 'No se pudo editar la fila en Google Sheets (facturas)' };
        }


        const updatedInvoice = await Invoice.findByIdAndUpdate(
            invoiceId,
            { description, numeroFactura, amount, date, dueDate, status: false, currency, updatedAt: Date.now() },
            { new: true }
        );

        if (!updatedInvoice) {
            throw { status: 400, message: 'No se encontro la factura.' };
        }

        return updatedInvoice;


    } catch (error) {
        // Si ya es un error lanzado manualmente, lo re-lanzamos
        if (error.status) throw error;

        // Si es un error inesperado, lo manejamos como interno
        console.error('createInvoice Error:', error);
        throw { status: 500, message: 'Error interno del servidor' };
    }
};
