function errorMiddleware(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  const status  = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({ message });
}

module.exports = errorMiddleware;
