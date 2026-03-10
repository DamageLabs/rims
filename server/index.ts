import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const { seedDatabase } = await import('./db/seed');
  const authRoutes = (await import('./routes/auth')).default;
  const itemRoutes = (await import('./routes/items')).default;
  const inventoryTypeRoutes = (await import('./routes/inventoryTypes')).default;
  const categoryRoutes = (await import('./routes/categories')).default;
  const stockHistoryRoutes = (await import('./routes/stockHistory')).default;
  const costHistoryRoutes = (await import('./routes/costHistory')).default;
  const templateRoutes = (await import('./routes/templates')).default;
  const bomRoutes = (await import('./routes/boms')).default;
  const userRoutes = (await import('./routes/users')).default;

  // Seed database on startup
  seedDatabase();

  const app = express();
  const PORT = process.env.PORT || 3001;

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/inventory-types', inventoryTypeRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/stock-history', stockHistoryRoutes);
  app.use('/api/cost-history', costHistoryRoutes);
  app.use('/api/templates', templateRoutes);
  app.use('/api/boms', bomRoutes);
  app.use('/api/users', userRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main();
