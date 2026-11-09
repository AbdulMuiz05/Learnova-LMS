import { Server } from 'socket.io';

let io: Server | null = null;

export function setSocketServer(server: Server): void {
  io = server;
}

export function getSocketServer(): Server | null {
  return io;
}

export const userRoom = (userId: string): string => `user:${userId}`;

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(userRoom(userId)).emit(event, payload);
}

export function emitToAdmins(event: string, payload: unknown): void {
  io?.to('admins').emit(event, payload);
}
