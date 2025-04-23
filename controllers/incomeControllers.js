import express from 'express';
import Income from '../models/Income.js';
import { appendToSheet } from '../googleapi/google.js';
import { getExchangeRateByDate } from './exchangeRateController.js';



async function addToGoogleSheet(date, totalSistema,
    efectivoBs,
    efectivoDolares,
    puntoExterno,
    pagomovil,
    biopago,
    sitef,
    gastosBs,
    gastosDolares,
    notas, rate) {
    // Crear y guardar el nuevo gasto
    const dateForGoogleSheets = new Date(date);
    const fechaSheets = (dateForGoogleSheets - new Date("1899-12-30")) / (1000 * 60 * 60 * 24);

    const values = [
        fechaSheets, parseFloat(efectivoBs), parseFloat(efectivoDolares), parseFloat(sitef), parseFloat(puntoExterno), parseFloat(pagomovil), parseFloat(biopago),
        parseFloat(gastosBs), parseFloat(gastosDolares), parseFloat(totalSistema), notas, rate
    ];

    return appendToSheet('ingresos', [values], {
        "A": { numberFormat: { type: "DATE", pattern: "yyyy-mm-dd" } },
        "B": { numberFormat: { type: "NUMBER", pattern: '"Bs" #,##0.00' } },
        "C": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
        "D": { numberFormat: { type: "NUMBER", pattern: '"Bs" #,##0.00' } },
        "E": { numberFormat: { type: "NUMBER", pattern: '"Bs" #,##0.00' } },
        "F": { numberFormat: { type: "NUMBER", pattern: '"Bs" #,##0.00' } },
        "G": { numberFormat: { type: "NUMBER", pattern: '"Bs" #,##0.00' } },
        "H": { numberFormat: { type: "NUMBER", pattern: '"Bs" #,##0.00' } },
        "I": { numberFormat: { type: "NUMBER", pattern: '"Bs" #,##0.00' } },
        "J": { numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" } },
        "L": { numberFormat: { type: "NUMBER", pattern: '"Bs" #,##0.00' } },
    });

}

export const createIncome = async (incomeData) => {
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
        } = incomeData;

        const rate = await getExchangeRateByDate(date);
        if (!rate) {
            return { status: 404, message: `No existe tasa de cambio para la fecha ${new Date(date).toLocaleDateString()}` };
        }

        const googleRow = await addToGoogleSheet(date, totalSistema,
            efectivoBs,
            efectivoDolares,
            puntoExterno,
            pagomovil,
            biopago,
            sitef,
            gastosBs,
            gastosDolares,
            notas, rate.rate)
        if (!googleRow) {
            return { status: 500, message: 'No se pudo registrar el ingreso en Google Sheets' };
        }

        // Crear y guardar el nuevo gasto
        const newIncome = new Income({
            sitef,
            puntoExterno,
            efectivoBs,
            efectivoDolares,
            pagomovil,
            biopago,
            gastosBs,
            sitef,
            gastosDolares,
            totalSistema,
            notas, date, googleRow
        });
        await newIncome.save();

        return newIncome;
    } catch (error) {
        console.error('createIncome Error:', error);
        return { status: 500, message: 'Error interno del servidor' };
    }
}