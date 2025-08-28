import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { sequelize } from './models/index.js';
import { validateEnvironment } from './utils/envValidation.js';
import swaggerSpecs from './docs/swagger.js';
import logger from './utils/logger.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { initializeWebSocket } from './services/websocket.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import customerRoutes from './routes/customers.js';
import jobRoutes from './routes/jobs.js';
import routeRoutes from './routes/routes.js';
import auditRoutes from './routes/audit.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';

import 'dotenv/config';

validateEnvironment();

const app = express();

app.use(helmet());
app.use(compression());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

app.use('/api/uploads', express.static('uploads'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SwiftTiger API Documentation'
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(globalErrorHandler);

app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async (): Promise<void> => {
  try {
    logger.info('Attempting to connect to database...');
    logger.info('Database config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      dialect: process.env.DB_DIALECT
    });
    
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL database');
    
    logger.info('Synchronizing database models...');
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized with fresh tables');
    
    const PORT = process.env.PORT || 5000;
    const server = createServer(app);
    
    const wsService = initializeWebSocket(server);
    logger.info('WebSocket service initialized');
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
      logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`WebSocket server ready for connections`);
    });
    
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  } catch (error: any) {
    logger.error('Unable to connect to the database:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();

export default app;