import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import PubSubService, { PubSubChannels } from '../services/pubsub.service';

const DATA_THROTTLE_MS = 1000;

class ServerSocket {
  private io: Server | null = null;
  private pubsub: PubSubService | null = null;

  // Throttle state: track last status per device to skip duplicate broadcasts
  private lastStatus: Map<number, string> = new Map();

  // Throttle state: buffer telemetry data per device
  private dataBuffer: Map<number, any[]> = new Map();
  private dataTimer: NodeJS.Timeout | null = null;

  init(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'secret'
        ) as JwtPayload;
        (socket as any).userId = decoded.id;
        (socket as any).userRole = decoded.role;
        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join-device', (deviceId: number) => {
        socket.join(`device:${deviceId}`);
        console.log(`Client ${socket.id} joined device:${deviceId}`);
      });

      socket.on('leave-device', (deviceId: number) => {
        socket.leave(`device:${deviceId}`);
        console.log(`Client ${socket.id} left device:${deviceId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    // Start telemetry flush timer
    this.dataTimer = setInterval(() => this.flushDataBuffer(), DATA_THROTTLE_MS);

    console.log('Socket.io initialized');
  }

  initPubSub(pubsub: PubSubService): void {
    this.pubsub = pubsub;

    pubsub.subscribe(PubSubChannels.DEVICE_UPDATE, (data) => {
      if (!this.io) return;

      // Skip if status hasn't changed
      const prevStatus = this.lastStatus.get(data.id);
      if (prevStatus === data.status) return;
      this.lastStatus.set(data.id, data.status);

      this.io.to(`device:${data.id}`).emit('device:update', data);
      this.io.emit('devices:status', data);
    });

    pubsub.subscribe(PubSubChannels.DEVICE_DATA, (data) => {
      if (!this.io) return;

      // Buffer telemetry, flush periodically
      const existing = this.dataBuffer.get(data.deviceId) || [];
      existing.push(data);
      this.dataBuffer.set(data.deviceId, existing);
    });

    pubsub.subscribe(PubSubChannels.DEVICE_ALERT, (data) => {
      if (!this.io) return;
      this.io.emit('device:alert', data);
    });

    console.log('PubSub listeners registered');
  }

  private flushDataBuffer(): void {
    if (!this.io || this.dataBuffer.size === 0) return;

    for (const [deviceId, points] of this.dataBuffer) {
      if (points.length === 0) continue;

      // Send latest point for targeted room
      const latest = points[points.length - 1];
      this.io.to(`device:${deviceId}`).emit('device:data', latest);

      this.dataBuffer.set(deviceId, []);
    }
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const serverSocket = new ServerSocket();
