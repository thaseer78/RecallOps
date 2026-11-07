import { Router } from 'express';
import { getActivity } from '../controllers/activity';

export function createActivityRouter(): Router {
  const router = Router();
  router.get('/', getActivity);
  return router;
}

