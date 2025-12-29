# TI4 Strategy Planner

This project is a Twilight Imperium 4 helper tool built with Angular 21 and Firebase.

## Features

- **Map Visualization**: Renders TI4 map strings (including PoK and custom maps) in an interactive Hex Grid.
- **Faction Planning**: View detailed faction abilities, starting units, and commodities.
- **Firebase Integration**:
  - **Auth**: Google Sign-In managed via Firebase Auth.
  - **Persistence**: Save your strategy plans (Map + Faction + Pools) to Cloud Firestore.
- **Expansions Supported**: 
  - Base Game
  - Prophecy of Kings (PoK)
  - Codex updates
  - Thunder's Edge (via map string support)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Firebase Configuration**:
   - The app is configured for project `matebar-shop-recreation` (alias `ti4-planner-chris-001`).
   - Ensure you have access to the Firebase project or update `src/app/app.config.ts` with your own keys.

3. **Run Locally**:
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200/`.

## Data Sources

- **Tiles**: Images are dynamically fetched from `milty.shenanigans.be`.
- **Factions**: Seeded in `src/app/core/data/factions.ts`. Add more factions there as needed.

## Architecture

- **Core Module**: Services for Map parsing, Auth, Faction data, and Persistence.
- **Planner Feature**: Standalone component handling the value simulation and UI.
- **Styles**: Vanilla CSS with a dark, premium aesthetic using Inter font.
