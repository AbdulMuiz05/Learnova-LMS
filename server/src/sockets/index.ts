import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env, isProduction } from '../config/env';
import { User } from '../models/User';
import { ACCESS_COOKIE, verifyAccessToken } from '../utils/tokens';
import { logger } from '../utils/logger';
import { setSocketServer, userRoom } from './socket';

function parseCookieHeader(header: string): Record<string, string> {
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const separator = part.indexOf('=');
    if (separator === -1) return acc;
    const key = part.slice(0, separator).trim();
    if (!key) return acc;
    try {
      acc[key] = decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      acc[key] = part.slice(separator + 1).trim();
    }
    return acc;
  }, {});
}

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie ?? '';
      const parsed = parseCookieHeader(rawCookies);
      const token = parsed[ACCESS_COOKIE];
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('name role isActive isVerified');
      if (!user || !user.isActive || !user.isVerified) return next(new Error('Account is not allowed'));

      socket.data.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      };
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as { id: string; role: string };
    socket.join(userRoom(user.id));
    if (user.role === 'admin') socket.join('admins');

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  setSocketServer(io);
  logger.info(`Socket.IO initialized${isProduction ? '' : ' (development)'}`);
  return io;
}
