import axios from "axios";

/**
 * Obtiene tasa BCV por fecha (o hoy)
 * @param {Date|string|null} date
 * @returns {number}
 */
export const getBcvRate = async (date = null) => {
    let url = "https://bcv-api.rafnixg.dev/rates/";

    if (date) {
        let formattedDate;

        if (date instanceof Date) {
            formattedDate = date.toISOString().split("T")[0];
        } else {
            formattedDate = date;
        }

        url += formattedDate;
    }

    const { data } = await axios.get(url);

    const usdRate = data?.dollar;

    if (!usdRate) {
        throw new Error("No rate available");
    }

    return usdRate;
};

/**
 * Versión segura → intenta día anterior si falla
 */
export const getBcvRateSafe = async (date = null) => {
    try {
        return await getBcvRate(date);
    } catch (err) {
        console.log('ERROR OBJECT:', err.response?.status, err.message);
        if (!date) throw err;

        const d = new Date(date);
        d.setDate(d.getDate() - 1);

        return await getBcvRate(d);
    }
};
