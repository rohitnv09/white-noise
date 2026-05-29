import type { CreateProfilePayload, Profile, UpdateProfilePayload } from '@shared/types';

const DB_NAME = 'nature-sounds';
const DB_VERSION = 1;
const PROFILES_STORE = 'profiles';

function openProfilesDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILES_STORE)) {
        const store = db.createObjectStore(PROFILES_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open profiles database'));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openProfilesDb();
  try {
    const tx = db.transaction(PROFILES_STORE, mode);
    const result = await requestToPromise(callback(tx.objectStore(PROFILES_STORE)));

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    });

    return result;
  } finally {
    db.close();
  }
}

export async function fetchProfiles(): Promise<Profile[]> {
  const profiles = await withStore('readonly', store => store.getAll());
  return (profiles as Profile[]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createProfile(data: CreateProfilePayload): Promise<Profile> {
  const now = new Date().toISOString();
  const profile: Profile = {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description,
    sounds: data.sounds,
    masterVolume: data.masterVolume,
    createdAt: now,
    updatedAt: now,
  };

  await withStore('readwrite', store => store.add(profile));
  return profile;
}

export async function updateProfile(id: string, data: UpdateProfilePayload): Promise<Profile> {
  const existing = (await withStore('readonly', store => store.get(id))) as Profile | undefined;
  if (!existing) throw new Error('Profile not found');

  const updated: Profile = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await withStore('readwrite', store => store.put(updated));
  return updated;
}

export async function deleteProfile(id: string): Promise<void> {
  await withStore('readwrite', store => store.delete(id));
}
