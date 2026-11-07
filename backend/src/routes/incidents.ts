import { Router } from 'express';
import {
  listIncidents,
  getIncident,
  createIncident,
  updateIncident,
  investigateIncident,
  resolveIncident,
} from '../controllers/incidents';

export function createIncidentRouter(): Router {
  const router = Router();

  router.get('/', listIncidents);
  router.post('/', createIncident);
  router.get('/:id', getIncident);
  router.patch('/:id', updateIncident);
  router.post('/:id/investigate', investigateIncident);
  router.post('/:id/resolve', resolveIncident);

  return router;
}

