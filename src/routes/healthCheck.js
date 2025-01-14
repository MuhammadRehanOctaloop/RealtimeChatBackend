import { Router } from 'express';
import { healthCheck } from '../controllers/healthCheck.js';

const router = Router();

router.route('/health-check').get(healthCheck);

export default router;


