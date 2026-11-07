import { Router } from 'express';
import {
  getMemories,
  retainMemory,
  recallMemories,
} from '../controllers/memories';

export function createMemoryRouter(): Router {
  const router = Router();

  router.get('/', getMemories);
  router.post('/retain', retainMemory);
  router.post('/recall', recallMemories);

  return router;
}

