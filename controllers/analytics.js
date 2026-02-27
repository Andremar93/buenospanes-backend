import { buildMonthlyCashFlow } from '../services/analytics.service.js';

export const getMonthlyCashFlow = async (req, res, next) => {
    try {
        const { year, month } = req.query;

        const result = await buildMonthlyCashFlow({
            year: Number(year),
            month: Number(month),
        });
        console.log("RESULT:", result)
        res.json(result);
    } catch (error) {
        next(error);
    }
};