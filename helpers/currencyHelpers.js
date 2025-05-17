export function parseAmount(amount) {
    if (typeof amount === 'string') {
        // Reemplaza coma por punto y convierte a número
        amount = parseFloat(amount.replace(',', '.'));
    }
    return isNaN(amount) ? 0 : amount; // Evita NaN
}

export function convertToDollars(rate, amount) {
    return Number((amount / rate).toFixed(2));
}

export function convertToBS(rate, amount) {
    return Number((amount * rate).toFixed(2));
}

export function calculateAmounts(amount, currency, rate) {
    const parsedAmount = parseAmount(amount);
    if (currency === 'Bs') {
        return {
            amountBs: parsedAmount,
            amountDollars: convertToDollars(rate, parsedAmount),
        };
    }
    return {
        amountBs: convertToBS(rate, parsedAmount),
        amountDollars: parsedAmount,
    };
}
