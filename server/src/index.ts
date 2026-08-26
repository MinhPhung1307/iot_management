import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import sequelize from './config/database';
import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import notificationRoutes from './routes/notificationRoutes';
import groupRoutes from './routes/groupRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import policyRoutes from './routes/policyRoutes';
import User from './models/User';
import { Policy, PolicyCondition } from './models';
import { serverSocket } from './websocket/socket';
import { mqttClient } from './mqtt/mqttClient';
import { pubsub } from './services/pubsub.service';
import { batchWriter } from './services/batchWriter.service';
import { errorHandler } from './middleware/errorHandler';
import { runMigrations } from './database/migrations/run';
import { PolicyEngine } from './domain/policies/PolicyEngine';
import { PolicyRepository } from './infrastructure/repositories/PolicyRepository';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/policies', policyRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const seedAdmin = async (): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME;

  if (!adminEmail || !adminPassword || !adminName) {
    console.log('Admin credentials not found in .env, skipping seed');
    return;
  }

  const existingAdmin = await User.findOne({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log('Admin account already exists');
    return;
  }

  await User.create({
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: 'admin',
    department: 'management',
    location: 'headquarters',
    clearanceLevel: 5,
  });

  console.log(`Admin account created: ${adminEmail}`);
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');

    // Initialize PolicyEngine
    const policyRepository = new PolicyRepository();
    const policyEngine = new PolicyEngine(policyRepository);
    app.set('policyEngine', policyEngine);
    console.log('PolicyEngine initialized');

    serverSocket.init(httpServer);
    serverSocket.initPubSub(pubsub);
    batchWriter.start();
    console.log('WebSocket + PubSub + BatchWriter initialized');

    try {
      mqttClient.setPubSub(pubsub);
      mqttClient.connect();
      console.log('MQTT client connecting...');
    } catch (err) {
      console.log('MQTT not available, running without MQTT');
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  mqttClient.disconnect();
  await batchWriter.stop();
  await pubsub.disconnect();
  process.exit(0);
});

startServer();

export default app;
