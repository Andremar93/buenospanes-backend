import Income from '../models/Income.js';
import Expense from '../models/Expense.js';

export const buildMonthlyCashFlow = async ({
    year,
    month,
}) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const incomes = await Income.find({
        date: { $gte: start, $lt: end }
    }).lean();

    const expenses = await Expense.find({
        date: { $gte: start, $lt: end },
        paid: true
    }).lean();

    const map = {};

    // Procesar ingresos
    incomes.forEach(income => {
        const day = income.date.toISOString().split('T')[0];

        if (!map[day]) {
            map[day] = {
                gastos: 0,
                ingresosCuenta: 0,
                ingresosBsEfectivo: 0,
                ingresosUsdEfectivo: 0,
                gastosCuenta: 0,
                gastosBsEfectivo: 0,
                gastosUsdEfectivo: 0
            };
        }

        const cuenta =
            (income.sitef || 0) +
            (income.puntoExterno || 0) +
            (income.pagomovil || 0) +
            (income.biopago || 0);

        const bsEfectivo = (income.efectivoBs || 0);
        const usdEfectivo = (income.efectivoDolares || 0);

        // Guardar por método
        map[day].ingresosCuenta += cuenta;
        map[day].ingresosBsEfectivo += bsEfectivo;
        map[day].ingresosUsdEfectivo += usdEfectivo;

    });

    expenses.forEach(expense => {
        const day = expense.date.toISOString().split('T')[0];

        if (!map[day]) {
            map[day] = {
                // Totales generales
                gastos: 0,

                // Ingresos por método
                ingresosCuenta: 0,
                ingresosBsEfectivo: 0,
                ingresosUsdEfectivo: 0,

                // Gastos por método
                gastosCuenta: 0,
                gastosBsEfectivo: 0,
                gastosUsdEfectivo: 0
            };
        }

        const amount = (expense.amountBs || 0);

        // Total general (para net)
        map[day].gastos += amount;

        // Separación por método
        if (expense.paymentMethod === 'cuentaBs' ||
            expense.paymentMethod === 'transferencia') {

            map[day].gastosCuenta += amount;

        } else if (expense.paymentMethod === 'bsEfectivo') {

            map[day].gastosBsEfectivo += amount;

        } else if (expense.paymentMethod === 'dolaresEfectivo') {

            map[day].gastosUsdEfectivo += expense.amountDollars;
        }
    });

    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month - 1, i)
            .toISOString()
            .split('T')[0];

        if (!map[date]) {
            map[date] = {
                ingresosCuenta: 0,
                ingresosBsEfectivo: 0,
                ingresosUsdEfectivo: 0,
                gastosCuenta: 0,
                gastosBsEfectivo: 0,
                gastosUsdEfectivo: 0,
            };
        }
    }

    const sortedDates = Object.keys(map).sort();

    let runningTotal = 0;
    let runningCuenta = 0;
    let runningBs = 0;
    let runningUsd = 0;

    const days = sortedDates.map(date => {
        const data = map[date];

        const netCuenta = data.ingresosCuenta - data.gastosCuenta;
        const netBsEfectivo = data.ingresosBsEfectivo - data.gastosBsEfectivo;
        const netUsdEfectivo = data.ingresosUsdEfectivo - data.gastosUsdEfectivo;

        const net = netCuenta + netBsEfectivo;

        runningTotal += net;
        runningCuenta += netCuenta;
        runningBs += netBsEfectivo;
        runningUsd += netUsdEfectivo;

        return {
            date,

            // Ingresos diarios
            ingresosCuenta: data.ingresosCuenta,
            ingresosBsEfectivo: data.ingresosBsEfectivo,
            ingresosUsdEfectivo: data.ingresosUsdEfectivo,

            // Gastos diarios
            gastosCuenta: data.gastosCuenta,
            gastosBsEfectivo: data.gastosBsEfectivo,
            gastosUsdEfectivo: data.gastosUsdEfectivo,

            // Nets diarios
            net,
            netCuenta,
            netBsEfectivo,
            netUsdEfectivo,

            // Acumulados
            accumulated: runningTotal,
            accumulatedCuenta: runningCuenta,
            accumulatedBsEfectivo: runningBs,
            accumulatedUsdEfectivo: runningUsd,
        };
    });

    return {
        // balanceFinal: running,
        days
    };
};