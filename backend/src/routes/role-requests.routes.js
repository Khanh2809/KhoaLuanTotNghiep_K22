import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { createRoleRequest, listMyRoleRequests } from '../controllers/role-requests.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/', createRoleRequest);
router.get('/me', listMyRoleRequests);

export default router;
