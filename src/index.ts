import type { Request, Response } from 'express';
import { createApp } from './main';

let app: ReturnType<typeof createApp> extends Promise<infer T> ? T : never;

export default async function handler(req: Request, res: Response) {
  if (!app) {
    app = await createApp();
  }
  app(req, res);
}
