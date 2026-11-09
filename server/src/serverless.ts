import { createApp } from './app';
import { logger } from './utils/logger';

// Vercel preserves this module between warm invocations but discards it on
// cold starts. Socket.IO is deliberately not initialized: Vercel Functions
// cannot keep a persistent WebSocket server. Notifications are still persisted
// to MongoDB, and the emit helpers in sockets/socket.ts become no-ops.
const app = createApp({ awaitDatabase: true });

logger.info('Serverless API initialized with Socket.IO disabled.');

export default app;
