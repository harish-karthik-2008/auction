// Complete, self-contained Auctioneer Engine with localStorage persistence
import { defaultPlacesList } from '../services/defaultPlacesList';

const STORAGE_KEY = 'japan_auction_arena_12_teams_v1';

const TEAM_PRESETS = [
  { name: 'Team Sakura', color: '#ff758f' },
  { name: 'Team Samurai', color: '#3b82f6' },
  { name: 'Team Shogun', color: '#f59e0b' },
  { name: 'Team Ninja', color: '#10b981' },
  { name: 'Team Ronin', color: '#8b5cf6' },
  { name: 'Team Kitsune', color: '#ef4444' },
  { name: 'Team Dragon', color: '#14b8a6' },
  { name: 'Team Phoenix', color: '#d97706' },
  { name: 'Team Daimyo', color: '#6366f1' },
  { name: 'Team Kabuki', color: '#ec4899' },
  { name: 'Team Akatsuki', color: '#e11d48' },
  { name: 'Team Fuji', color: '#0ea5e9' }
];

function generateId() {
  return 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Initial state builder
export function createInitialState(numTeams = 12, startingPurse = 30000000, auctioneerName = 'Master Auctioneer') {
  const teams = [];
  const teamCount = Math.max(2, Math.min(Number(numTeams) || 12, 12));

  for (let i = 0; i < teamCount; i++) {
    const preset = TEAM_PRESETS[i % TEAM_PRESETS.length];
    teams.push({
      id: generateId(),
      name: preset.name,
      color: preset.color,
      startingPurse: Number(startingPurse) || 30000000,
      remainingPurse: Number(startingPurse) || 30000000
    });
  }

  const places = defaultPlacesList.map((dp, idx) => ({
    id: generateId(),
    name: dp.name,
    imageUrl: dp.imageUrl,
    location: dp.location,
    description: dp.description || '',
    basePrize: Number(dp.basePrize),
    originalValue: Number(dp.originalValue),
    status: 'AVAILABLE', // 'AVAILABLE', 'SOLD', 'UNSOLD'
    purchasedPrice: null,
    purchasedByTeamId: null,
    orderIndex: idx
  }));

  return {
    auctioneerName,
    startingPurse: Number(startingPurse) || 30000000,
    status: 'IN_PROGRESS', // 'IN_PROGRESS', 'ENDED'
    teams,
    places,
    purchases: [],
    createdAt: new Date().toISOString(),
    endedAt: null
  };
}

// Load state from localStorage with automatic schema validation & tiered price enforcement
export function loadAuctionState() {
  try {
    // Clear all legacy storage keys so user's browser does not serve old caches
    const legacyKeys = [
      'japan_auction_arena_30_cities_v1',
      'japan_auction_arena_10_teams_v1',
      'japan_auction_arena_3tiered_base_v1',
      'japan_auction_arena_tiered_prices_v2',
      'jp_auction_arena_db_v1',
      'japan_auction_arena_cache',
      'auction_state'
    ];
    legacyKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch (e) {}
    });

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate 30 cities, 12 teams, and correct tiered base prizes
      const hasTieredPrices =
        parsed.places &&
        parsed.places.length === 30 &&
        parsed.places[0]?.basePrize === 3000000 &&
        parsed.places[10]?.basePrize === 2000000 &&
        parsed.places[20]?.basePrize === 1000000;

      const hasTwelveTeams = parsed.teams && parsed.teams.length >= 12;

      if (hasTieredPrices && hasTwelveTeams) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading auction state:', err);
  }

  // Create clean state with 12 teams and 30 tiered cities
  const fresh = createInitialState(12, 30000000);
  saveAuctionState(fresh);
  return fresh;
}

// Reset tournament to official state
export function resetToOfficialCatalog() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
  const fresh = createInitialState(12, 30000000);
  saveAuctionState(fresh);
  return fresh;
}

// Save state to localStorage
export function saveAuctionState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving auction state:', err);
  }
}

/**
 * Section 4 Valuation Engine
 */
export function calculateTeamStats(state, teamId) {
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return null;

  const ownedPlaces = state.places.filter(
    p => p.status === 'SOLD' && p.purchasedByTeamId === teamId
  );

  const totalOriginalValue = ownedPlaces.reduce((sum, p) => sum + (Number(p.originalValue) || 0), 0);
  const totalPurchasedCost = ownedPlaces.reduce((sum, p) => sum + (Number(p.purchasedPrice) || 0), 0);
  const remainingPurse = team.startingPurse - totalPurchasedCost;
  const totalCurrentValue = remainingPurse + totalOriginalValue;
  const auctionGain = totalCurrentValue - team.startingPurse;

  team.remainingPurse = remainingPurse;

  return {
    teamId: team.id,
    teamName: team.name,
    color: team.color,
    startingPurse: team.startingPurse,
    remainingPurse,
    placesPurchasedCount: ownedPlaces.length,
    totalPurchasedCost,
    totalOriginalValue,
    totalCurrentValue,
    auctionGain,
    ownedPlaces: ownedPlaces.map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      location: p.location,
      originalValue: p.originalValue,
      purchasedPrice: p.purchasedPrice
    }))
  };
}

/**
 * Section 5 Leaderboard & Tie-Breaker Engine
 */
export function calculateLeaderboard(state) {
  const statsList = state.teams.map(t => calculateTeamStats(state, t.id));

  statsList.sort((a, b) => {
    if (b.totalCurrentValue !== a.totalCurrentValue) {
      return b.totalCurrentValue - a.totalCurrentValue;
    }
    return b.remainingPurse - a.remainingPurse;
  });

  for (let i = 0; i < statsList.length; i++) {
    if (i > 0) {
      const prev = statsList[i - 1];
      const curr = statsList[i];
      if (prev.totalCurrentValue === curr.totalCurrentValue && prev.remainingPurse === curr.remainingPurse) {
        curr.rank = prev.rank;
        curr.isTied = true;
        prev.isTied = true;
      } else {
        curr.rank = i + 1;
        curr.isTied = false;
      }
    } else {
      statsList[i].rank = 1;
      statsList[i].isTied = false;
    }
  }

  return statsList;
}
