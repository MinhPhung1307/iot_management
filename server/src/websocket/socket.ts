import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

class ServerSocket {
  private io: Server | null = null;

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

  emitDeviceUpdate(deviceId: number, data: any): void {
    if (!this.io) return;

    this.io.to(`device:${deviceId}`).emit('device:update', data);
    this.io.emit('devices:status', { deviceId, ...data });
  }

  emitDeviceData(deviceId: number, data: any): void {
    if (!this.io) return;

    this.io.to(`device:${deviceId}`).emit('device:data', { deviceId, ...data });
  }

  emitAlert(deviceId: number, alert: any): void {
    if (!this.io) return;

    this.io.emit('device:alert', { deviceId, ...alert });
  }

  broadcastToAll(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, data);
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const serverSocket = new ServerSocket();
