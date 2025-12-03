import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { issueCertificate, listCertificates, verifyCertificate, requestCertificate, getCertificateStatus } from '../controllers/certificates.controller.js';

const router = Router();

router.get('/', requireAuth, listCertificates);
router.post('/', requireAuth, issueCertificate);
router.get('/verify/:code', verifyCertificate);
router.post('/request', requireAuth, requestCertificate);
router.get('/status', requireAuth, getCertificateStatus);

export default router;
