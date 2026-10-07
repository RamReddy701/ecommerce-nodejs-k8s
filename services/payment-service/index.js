const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8081;

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-service',
  port: process.env.DB_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres_admin',
  password: process.env.POSTGRES_PASSWORD || 'SuperSecureProductionPassword123!',
  database: process.env.PAYMENTS_DB_NAME || 'postgres',
});

let isReady = false;

// Kubernetes Health Probes
app.get('/livez', (req, res) => res.status(200).send('OK'));
app.get('/readyz', (req, res) => {
  if (isReady) return res.status(200).send('READY');
  return res.status(503).send('NOT_READY');
});

// Process Payment Endpoint
app.post('/api/v1/payments', async (req, res) => {
  const { order_id, amount } = req.body;

  if (!order_id || !amount) {
    return res.status(400).json({ error: 'Missing order_id or amount' });
  }

  // Simulate payment processing time
  const paymentId = `pay_${Date.now()}`;
  console.log(`[Payment Service] Processing payment ${paymentId} for order ${order_id}...`);

  try {
    // (Simulated) Save to Database
    // await pool.query('INSERT INTO payments (id, order_id, amount, status) VALUES ($1, $2, $3, $4)', [paymentId, order_id, amount, 'SUCCESS']);

    res.status(200).json({
      payment_id: paymentId,
      order_id,
      status: 'SUCCESS',
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[Payment Service] DB Error:`, error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const server = app.listen(PORT, async () => {
  console.log(`Payment Service running on port ${PORT}`);
  try {
    await pool.query('SELECT 1');
    isReady = true;
  } catch (err) {
    console.error('Failed to connect to Database', err);
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  isReady = false;
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});
