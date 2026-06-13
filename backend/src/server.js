const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const vinylRoutes = require('./routes/vinyl');
const orderRoutes = require('./routes/order');
const revenueRoutes = require('./routes/revenue');
const musicianRoutes = require('./routes/musician');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/vinyl', vinylRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/musicians', musicianRoutes);

app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    data: null
  });
});

app.listen(PORT, () => {
  console.log(`🚀 黑胶众筹后端服务已启动: http://localhost:${PORT}`);
});
