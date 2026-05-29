# Nature Sounds

A calm, browser-based nature sound mixer for building ambient soundscapes with rain, waves, wildlife, fire, wind, and forest textures.

Live app: [white-noise-sounds.vercel.app](https://white-noise-sounds.vercel.app)

## What It Does

- Mix multiple natural sounds at once.
- Control individual sound volumes and a master volume.
- Save favorite mixes as profiles.
- Store profiles locally in IndexedDB, so there is no account, server, or database to maintain.
- Stream audio in the browser for faster startup than full-file download/decode playback.
- Run as a static Vite app, ready for simple Vercel deployment.

## Tech Stack

- React 19
- TypeScript
- Vite
- Zustand for mixer state
- TanStack Query for profile CRUD state
- IndexedDB for local profile persistence
- Framer Motion for UI transitions
- Web Audio API for volume control and visualization

## Project Structure

```text
.
├── client/          # Vite React app
├── shared/          # Shared TypeScript profile/sound types
├── package.json     # Workspace scripts
└── README.md
```

This project intentionally has no backend. Profiles live in the user's browser through IndexedDB.

## Getting Started

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

The production build is emitted to:

```text
client/dist
```

## Deployment

The app is deployed on Vercel as a static frontend.

Recommended Vercel settings:

```text
Build Command: npm run build
Output Directory: client/dist
Install Command: npm install
```

No environment variables are required.

## Notes On Audio

The app currently streams preview audio from Freesound CDN URLs. For the most reliable production experience, host optimized, licensed loop files on a CDN or static asset store and update the sound catalog in:

```text
client/src/constants/sounds.ts
```

Good production audio targets:

- Short seamless loops
- Compressed MP3 or Ogg files
- CDN-hosted assets with long cache headers
- Clear license attribution when required

## Profiles And Privacy

Saved profiles never leave the browser. Clearing site data or using another device/browser will remove or hide those saved mixes.
