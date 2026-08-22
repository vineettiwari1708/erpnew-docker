'use strict'

const WINDOW = 60 * 1000

const _times     = []
const _errors    = []
const _durations = []

function cleanup() {
  const cutoff = Date.now() - WINDOW
  let i
  for (i = 0; i < _times.length && _times[i] < cutoff; i++);
  if (i) _times.splice(0, i)
  for (i = 0; i < _errors.length && _errors[i] < cutoff; i++);
  if (i) _errors.splice(0, i)
  for (i = 0; i < _durations.length && _durations[i].t < cutoff; i++);
  if (i) _durations.splice(0, i)
}

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics' || req.path === '/health') return next()
  const start = Date.now()
  _times.push(start)
  res.on('finish', () => {
    _durations.push({ t: Date.now(), ms: Date.now() - start })
    if (res.statusCode >= 400) _errors.push(Date.now())
  })
  next()
}

function metricsEndpoint(_req, res) {
  cleanup()
  const total  = _times.length
  const errors = _errors.length
  const avgMs  = _durations.length
    ? Math.round(_durations.reduce((s, d) => s + d.ms, 0) / _durations.length)
    : 0
  const p95Ms = (() => {
    if (!_durations.length) return 0
    const sorted = [..._durations].sort((a, b) => a.ms - b.ms)
    return sorted[Math.floor(sorted.length * 0.95)].ms
  })()

  res.json({
    window_sec:     60,
    requests:       total,
    req_per_sec:    parseFloat((total / 60).toFixed(2)),
    errors,
    error_rate_pct: total ? parseFloat(((errors / total) * 100).toFixed(1)) : 0,
    avg_latency_ms: avgMs,
    p95_latency_ms: p95Ms,
  })
}

module.exports = { metricsMiddleware, metricsEndpoint }
