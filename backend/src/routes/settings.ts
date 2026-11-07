import { Router } from 'express';
import { getSettings } from '../controllers/settings';

export function createSettingsRouter(): Router {
  const router = Router();
  router.get('/status', getSettings);
  return router;
}

