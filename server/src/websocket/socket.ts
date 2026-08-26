import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import PubSubService, { PubSubChannels } from '../services/pubsub.service';

class ServerSocket {
  private io: Server | null = null;
  private pubsub: PubSubService | null = null;

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

    console.log('Socket.io initialized');
  }

  initPubSub(pubsub: PubSubService): void {
    this.pubsub = pubsub;

    pubsub.subscribe(PubSubChannels.DEVICE_UPDATE, (data) => {
      if (!this.io) return;
      this.io.to(`device:${data.id}`).emit('device:update', data);
      this.io.emit('devices:status', data);
    });

    pubsub.subscribe(PubSubChannels.DEVICE_DATA, (data) => {
      if (!this.io) return;
      this.io.to(`device:${data.deviceId}`).emit('device:data', data);
    });

    pubsub.subscribe(PubSubChannels.DEVICE_ALERT, (data) => {
      if (!this.io) return;
      this.io.emit('device:alert', data);
    });

    console.log('PubSub listeners registered');
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const serverSocket = new ServerSocket();
