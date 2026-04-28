import { Router } from 'express';
import { z } from 'zod';
import { getDatabase } from '../db/connection.js';
import * as profileModel from '../models/profile.js';
import { validateBody } from '../middleware/validate.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

const soundMixEntrySchema = z.object({
  soundId: z.string().min(1),
  volume: z.number().min(0).max(1),
});

const createProfileSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  sounds: z.array(soundMixEntrySchema).min(1).max(20),
  masterVolume: z.number().min(0).max(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  sounds: z.array(soundMixEntrySchema).min(1).max(20).optional(),
  masterVolume: z.number().min(0).max(1).optional(),
});

router.get('/', (_req, res) => {
  const db = getDatabase();
  const profiles = profileModel.getAllProfiles(db);
  res.json({ data: profiles });
});

router.get('/:id', (req, res, next) => {
  const db = getDatabase();
  const id = req.params['id'] as string;
  const profile = profileModel.getProfileById(db, id);
  if (!profile) {
    next(createError(404, 'PROFILE_NOT_FOUND', 'Profile not found'));
    return;
  }
  res.json({ data: profile });
});

router.post('/', validateBody(createProfileSchema), (req, res) => {
  const db = getDatabase();
  const profile = profileModel.createProfile(db, req.body);
  res.status(201).json({ data: profile });
});

router.put('/:id', validateBody(updateProfileSchema), (req, res, next) => {
  const db = getDatabase();
  const id = req.params['id'] as string;
  const profile = profileModel.updateProfile(db, id, req.body);
  if (!profile) {
    next(createError(404, 'PROFILE_NOT_FOUND', 'Profile not found'));
    return;
  }
  res.json({ data: profile });
});

router.delete('/:id', (req, res, next) => {
  const db = getDatabase();
  const id = req.params['id'] as string;
  const deleted = profileModel.deleteProfile(db, id);
  if (!deleted) {
    next(createError(404, 'PROFILE_NOT_FOUND', 'Profile not found'));
    return;
  }
  res.json({ success: true });
});

export default router;
