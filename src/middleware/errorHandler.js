export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Please check the submitted fields', errors: Object.values(err.errors).map(item => item.message) });
  }
  if (err?.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'Request body is too large' });
  console.error(err);
  return res.status(500).json({ success: false, message: 'An unexpected server error occurred' });
}
