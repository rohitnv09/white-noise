import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { Profile, CreateProfilePayload, UpdateProfilePayload, SoundMixEntry } from '../../../shared/src/types.js';

interface ProfileRow {
  id: string;
  name: string;
  description: string | null;
  sounds_json: string;
  master_volume: number;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    sounds: JSON.parse(row.sounds_json) as SoundMixEntry[],
    masterVolume: row.master_volume,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllProfiles(db: Database.Database): Profile[] {
  const rows = db.prepare('SELECT * FROM profiles ORDER BY created_at DESC').all() as ProfileRow[];
  return rows.map(rowToProfile);
}

export function getProfileById(db: Database.Database, id: string): Profile | null {
  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id) as ProfileRow | undefined;
  return row ? rowToProfile(row) : null;
}

export function createProfile(db: Database.Database, data: CreateProfilePayload): Profile {
  const id = uuidv4();
  const now = new Date().toISOString();
  const soundsJson = JSON.stringify(data.sounds);

  db.prepare(
    `INSERT INTO profiles (id, name, description, sounds_json, master_volume, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, data.name, data.description ?? null, soundsJson, data.masterVolume, now, now);

  return {
    id,
    name: data.name,
    description: data.description,
    sounds: data.sounds,
    masterVolume: data.masterVolume,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateProfile(db: Database.Database, id: string, data: UpdateProfilePayload): Profile | null {
  const existing = getProfileById(db, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const name = data.name ?? existing.name;
  const description = data.description !== undefined ? data.description : existing.description;
  const sounds = data.sounds ?? existing.sounds;
  const masterVolume = data.masterVolume ?? existing.masterVolume;
  const soundsJson = JSON.stringify(sounds);

  db.prepare(
    `UPDATE profiles SET name = ?, description = ?, sounds_json = ?, master_volume = ?, updated_at = ?
     WHERE id = ?`
  ).run(name, description ?? null, soundsJson, masterVolume, now, id);

  return {
    id,
    name,
    description,
    sounds,
    masterVolume,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
}

export function deleteProfile(db: Database.Database, id: string): boolean {
  const result = db.prepare('DELETE FROM profiles WHERE id = ?').run(id);
  return result.changes > 0;
}
