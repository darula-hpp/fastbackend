import { Router } from 'express';

export const router = Router();

router.post('/users/:userId/send-email', (req, res) => {
  res.json({ status: 'sent', user_id: Number(req.params.userId) });
});
