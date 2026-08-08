# VoxBack

VoxBack is a two-player pass-and-play mobile party game built with React Native, Expo, TypeScript, and Expo Router.

Tagline: Hear it. Say it back.

The core game is designed to work offline: players record real voice clips, the app reverses PCM audio locally, compares reversed attempts with audio features and dynamic time warping, then scores each round.

## Features

- Real microphone recording through Expo's native PCM audio stream.
- Local WAV encoding, reversal, playback, and cleanup. No voice recording is uploaded.
- Similarity scoring with normalized audio features and Dynamic Time Warping.
- Two-player pass-and-play game flow with alternating creator/guesser roles.
- Free Mode and Challenge Mode with English and Arabic phrase packs.
- English/Arabic localization with RTL support.
- Scoreboard, final winner handling, local statistics, haptics, sound effects, confetti, and native result sharing.

## Setup

```bash
npm install
```

## Run On iOS

```bash
npm run ios
```

Use a real iPhone or a development build for microphone testing. iOS simulator microphone behavior can vary by host setup.

## Run On Android

```bash
npm run android
```

Use a real Android device or emulator with microphone input enabled.

## Development

```bash
npm start
npm run typecheck
npm test
npm run lint
```

## Production Builds

Install or use EAS CLI with `npx`, then authenticate with Expo:

```bash
npx eas-cli login
npm run build:ios
npm run build:android
```

The app identifiers are configured as `com.voxback.game` for iOS and Android. Store signing credentials, bundle IDs, and EAS project IDs should be connected in Expo before App Store or Google Play submission.

## Architecture

```text
app/                  Expo Router routes
src/components/       Reusable party-game UI and audio controls
src/screens/          Screen-level flows
src/services/         Audio recording, playback, reversal, similarity, feedback, game logic
src/stores/           Zustand game/settings/statistics state
src/localization/     English and Arabic dictionaries
src/constants/        Phrase packs, game options, reactions
src/theme/            Shared visual tokens
tests/                Pure service and game-flow tests
```

## Privacy

VoxBack processes recordings locally on the device. Temporary WAV files live in the app cache and are deleted when games are cleared, restarted, or attempts are retried. Sharing exports a result image only, not audio.

## Current Limitations

- The similarity engine is deterministic and local, but it is intentionally lightweight for mobile CPU budgets.
- Production iOS/Android store builds require Expo/EAS credentials that are not stored in this repository.
- Local native build verification depends on the developer machine having Xcode or Android Studio configured.
