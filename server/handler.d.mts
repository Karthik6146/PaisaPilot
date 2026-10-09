import type { IncomingMessage, ServerResponse } from 'node:http';
export function createHandler(options?: { config?: () => unknown }): (request: IncomingMessage, response: ServerResponse) => Promise<void>;
