# Japan Places Auction Arena 🇯🇵 | 日本の名所オークションアリーナ

A fullstack, real-time, responsive multiplayer auction game featuring famous destinations across Japan. Teams compete to bid on cultural landmarks, manage their team purse, and maximize their total valuation while auctioneers run the live bidding arena.

---

## ⛩️ Features

- **Atmospheric Japanese Aesthetic**: Sakura cherry blossom pink (`#ff758f`), deep navy indigo (`#0a1128`), gold leaf accents (`#ffd166`), authentic Japanese Kanji stamps (*Inkan* / *Hanko*), floating Sakura petals, and traditional wave patterns (*Seigaiha*).
- **Two Large Entry Options**:
  - **Create Auction**: Host an arena with custom team names, number of teams (2–8), starting purses, and generate a unique 6-digit Room OTP.
  - **Join Auction**: Enter using the 6-digit Room OTP and claim/register your team.
- **Strict Privacy & Role-Based Access Control (RBAC)**:
  - **Teams See Only**: Their own team name, their private remaining purse, the current live auction floor, available upcoming places, and their own acquired places with purchase prices and original reference valuations.
  - **Teams Cannot See**: Other teams' purses, other teams' spending, other teams' acquired places, or the auctioneer's master valuation ledger.
  - **Auctioneer Master View**: Complete financial ledger, real-time audit log, live bidding controls, place creation/editing, and automatic winner calculations.
- **Valuation & Tie-Breaker Scoring Engine**:
  - $\text{Remaining Purse} = \text{Starting Purse} - \text{Total Purchased Cost}$
  - $\text{Total Original Value} = \sum(\text{Original Reference Values of Places Owned})$
  - $\text{Total Current Team Value} = \text{Remaining Purse} + \text{Total Original Value}$
  - $\text{Auction Gain} = \text{Total Current Team Value} - \text{Starting Purse}$
  - **Tie-Breaker Rule**: Highest Total Current Team Value wins. If equal, higher Remaining Purse breaks the tie.
- **Pre-Seeded Authenticated Japan Destinations**:
  - Mount Fuji, Fushimi Inari Taisha, Kinkaku-ji Golden Pavilion, Shibuya Crossing, Himeji Castle, Dotonbori Osaka, Arashiyama Bamboo Grove, Itsukushima Floating Torii, Shirakawa-go, Senso-ji Temple, Nara Deer Park, and Akihabara Electric Town.
- **Overdraft & Transaction Safeguards**:
  - Server-side atomic validation prevents teams from bidding or spending more than their remaining purse balance.
  - One-click **Reopen / Correction** tool enables auctioneers to undo or adjust sold items, automatically refunding the team's purse.
- **Real-Time Synchronization**: Instant updates via WebSockets (Socket.IO).
- **Progressive Web App (PWA)**: Ready to install on iOS, Android, and desktop.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React + Vite, Lucide Icons, Canvas-Confetti, Vanilla CSS Design System.
- **Backend**: Node.js + Express + Socket.IO.
- **Database**: Persistent JSON/SQLite transactional database (`backend/db.js`) with zero configuration required. Also adaptable to MongoDB and PostgreSQL.
- **Real-Time Layer**: Room-segmented WebSockets with payload sanitization on the server.

---

## 📁 Database Schema (Section 8)

### `Game`
| Field | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique game room identifier |
| `roomCode` | String(6) | 6-digit OTP for teams to join |
| `auctioneerSecret` | UUID | Private creator credential (never sent to teams) |
| `auctioneerName` | String | Name of the Master Auctioneer |
| `startingPurse` | Number | Starting purse allocated to each team (e.g. 100,000) |
| `status` | Enum | `WAITING`, `IN_PROGRESS`, `ENDED` |
| `currentPlaceId` | UUID / Null | ID of place currently in live auction |
| `createdAt` | ISO Timestamp | Game creation timestamp |
| `endedAt` | ISO Timestamp | Game completion timestamp |

### `Team`
| Field | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique team identifier |
| `gameId` | UUID (FK) | Reference to the Game |
| `name` | String | Team name (e.g. Team Sakura, Team Samurai) |
| `teamToken` | UUID | Private session token for the team |
| `color` | String | Distinctive Japanese accent color |
| `startingPurse` | Number | Initial purse allocation |
| `remainingPurse` | Number | Current available points balance |
| `isClaimed` | Boolean | Whether player has claimed this team |

### `Place`
| Field | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique landmark identifier |
| `gameId` | UUID (FK) | Reference to the Game |
| `name` | String | Place name and Japanese Kanji |
| `imageUrl` | String | High-resolution authenticated photograph |
| `location` | String | Prefecture / Region in Japan |
| `description` | String | Landmark history and story |
| `basePrize` | Number | Minimum starting bid |
| `originalValue` | Number | Actual / Reference reference valuation |
| `currentBid` | Number | Active floor bid |
| `status` | Enum | `UPCOMING`, `LIVE`, `SOLD`, `UNSOLD` |
| `purchasedPrice` | Number / Null | Final confirmed sale price |
| `purchasedByTeamId` | UUID / Null | Winning team reference |

### `Purchase` (Audit Log)
| Field | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique purchase ledger ID |
| `gameId` | UUID (FK) | Reference to Game |
| `placeId` | UUID (FK) | Reference to Place |
| `teamId` | UUID (FK) | Reference to Purchasing Team |
| `purchasedPrice` | Number | Points spent |
| `timestamp` | ISO Timestamp | Transaction timestamp |
| `status` | Enum | `CONFIRMED`, `REVERTED` |

---

## 🚀 Quick Start (Running Locally)

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Start Both Backend & Frontend in Development Mode
```bash
npm run dev
```
- Backend starts at: `http://localhost:5000`
- Frontend Vite dev server starts at: `http://localhost:5173`

### 3. Or Build & Run in Production Mode
```bash
npm run build
npm start
```
The Express server will serve the bundled frontend and Socket.IO API together on `http://localhost:5000`.

---

## 🧪 Automated Testing

Run the included automated test suites:
```bash
# Run unit & valuation logic tests
node test_auction.js

# Run live E2E real-time WebSocket test
node test_e2e_live.js
```

---

## 🚢 Deployment Guide

### Option A: Unified Deployment (Render / Railway / Fly.io / Heroku)
1. Push the repository to GitHub.
2. In your host dashboard (e.g. [Render](https://render.com) or [Railway](https://railway.app)):
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Port: `5000` (or leave default `$PORT`)

### Option B: Decoupled Deployment (Vercel Frontend + Render Backend)
1. **Backend on Render**:
   - Build: `npm install`
   - Start: `node backend/server.js`
   - Environment Variables: `PORT=5000`, `CLIENT_URL=https://your-app.vercel.app`
2. **Frontend on Vercel**:
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Environment Variable: `VITE_API_BASE=https://your-render-backend.onrender.com`
