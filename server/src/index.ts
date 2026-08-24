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
import User from './models/User';
import { serverSocket } from './websocket/socket';
import { mqttClient } from './mqtt/mqttClient';

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

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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
  });

  console.log(`Admin account created: ${adminEmail}`);
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');

    await sequelize.sync({ alter: true });
    console.log('Database synchronized');

    await seedAdmin();

    serverSocket.init(httpServer);
    console.log('WebSocket initialized');

    try {
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

process.on('SIGINT', () => {
  mqttClient.disconnect();
  process.exit(0);
});

startServer();

export default app;
