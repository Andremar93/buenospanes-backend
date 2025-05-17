// middleware/auth.js
import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // Puedes usar req.user.id luego si lo necesitas
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

export default auth;
