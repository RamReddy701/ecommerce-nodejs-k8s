const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:8081';

// PostgreSQL Connection Pool (Recruiters look for this pattern)
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-service',
  port: process.env.DB_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres_admin',
  password: process.env.POSTGRES_PASSWORD || 'SuperSecureProductionPassword123!',
  database: process.env.ORDERS_DB_NAME || 'postgres',
});

let isReady = false;

// Kubernetes Health Probes
app.get('/livez', (req, res) => res.status(200).send('OK'));
app.get('/readyz', (req, res) => {
  if (isReady) return res.status(200).send('READY');
  return res.status(503).send('NOT_READY');
});

// Create Order Endpoint
app.post('/api/v1/orders', async (req, res) => {
  const { item, amount } = req.body;

  if (!item || !amount) {
    return res.status(400).json({ error: 'Missing item or amount' });
  }

  const orderId = `ord_${Date.now()}`;

  try {
    // 1. (Simulated) Save to Database
    // await pool.query('INSERT INTO orders (id, item, amount, status) VALUES ($1, $2, $3, $4)', [orderId, item, amount, 'PENDING']);

    // 2. Synchronous Inter-service call to Payment Service using Node native fetch
    console.log(`[Order Service] Requesting payment for Order: ${orderId}`);
    
    const paymentResponse = await fetch(`${PAYMENT_SERVICE_URL}/api/v1/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, amount })
    });

    if (!paymentResponse.ok) {
      throw new Error(`Payment failed with status: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();

    res.status(201).json({
      order_id: orderId,
      item,
      amount,
      status: 'CONFIRMED',
      payment_info: paymentData,
      created_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[Order Service] Error processing order:`, error.message);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

const server = app.listen(PORT, async () => {
  console.log(`Order Service running on port ${PORT}`);
  try {
    await pool.query('SELECT 1'); // Test DB connection
    console.log('Connected to PostgreSQL Database');
    isReady = true; // Signal K8s that we are ready for traffic
  } catch (err) {
    console.error('Failed to connect to Database on startup', err);
  }
});

// Graceful Shutdown Handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  isReady = false; // Immediately fail readiness probe
  
  server.close(async () => {
    console.log('HTTP server closed');
    await pool.end();
    console.log('Database pool closed');
    process.exit(0);
  });
});
