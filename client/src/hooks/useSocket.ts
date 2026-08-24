import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinDevice = (deviceId: number) => {
    socketRef.current?.emit('join-device', deviceId);
  };

  const leaveDevice = (deviceId: number) => {
    socketRef.current?.emit('leave-device', deviceId);
  };

  const onDeviceUpdate = (callback: (data: any) => void) => {
    socketRef.current?.on('devices:status', callback);
    return () => {
      socketRef.current?.off('devices:status', callback);
    };
  };

  const onDeviceData = (callback: (data: any) => void) => {
    socketRef.current?.on('device:data', callback);
    return () => {
      socketRef.current?.off('device:data', callback);
    };
  };

  const onAlert = (callback: (data: any) => void) => {
    socketRef.current?.on('device:alert', callback);
    return () => {
      socketRef.current?.off('device:alert', callback);
    };
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinDevice,
    leaveDevice,
    onDeviceUpdate,
    onDeviceData,
    onAlert,
  };
};
