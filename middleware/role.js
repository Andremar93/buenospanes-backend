// middleware/role.js
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    const { user } = req;
    if (!user || !allowedRoles.includes(user.userType)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
};

export default checkRole;
