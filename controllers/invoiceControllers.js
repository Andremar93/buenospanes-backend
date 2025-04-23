import express from 'express';
import Invoice from '../models/Invoice.js';
import { getExchangeRateByDate } from '../controllers/exchangeRateController.js';
import { appendToSheet } from '../googleapi/google.js';


async function addToGoogleSheet(dueDate, supplier, type, currency, description, amountDollars, amountBs, rate) {

    const dateForGoogleSheets = new Date();
    const fechaSheets = (dateForGoogleSheets - new Date("1899-12-30")) / (1000 * 60 * 60 * 24);

    const dueDateForGoogleSheets = new Date(dueDate)
    const dueDateSheets = (dueDateForGoogleSheets - new Date("1899-12-30")) / (1000 * 60 * 60 * 24)

    const values = [
        description, parseFloat(amountBs), parseFloat(amountDollars), currency, fechaSheets, dueDateSheets, type, supplier, rate.rate, false
    ];

    return appendToSheet('facturas', [values], {
        "C": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
        "E": { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } },
        "F": { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } },
        "I": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
    });
}
// Crear un nuevo gasto
export const createInvoice = async (invoiceData) => {
    try {
        const { dueDate, supplier, type, amount, currency } = invoiceData;

        const rate = await getExchangeRateByDate(new Date());
        if (!rate) {
            return { status: 404, message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}` };
        }

        let amountBs;
        let amountDollars;
        if (currency === 'Bs') {
            amountBs = amount;
            amountDollars = (amount / rate.rate).toFixed(2);
        } else {
            amountBs = (amount * rate.rate).toFixed(2);
            amountDollars = amount;
        }

        const description = supplier + ' ' + new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })

        const googleRow = await addToGoogleSheet(dueDate, supplier, type, currency, description, amountDollars, amountBs, rate)

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
        });

        await newInvoice.save();

        return newInvoice;
    } catch (error) {
        console.error('createInoviceFromController Error:', error);
        return { status: 500, message: 'Error interno del servidor' };
    }
};