import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Autenticação necessária." });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Autenticação necessária." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "O seu perfil não tem permissão para esta ação." });
    }
    next();
  };
}
