const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const defaultPlaces = require('./defaultPlaces');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory state structure
let state = {
  games: {},      // gameId -> Game object
  teams: {},      // teamId -> Team object
  places: {},     // placeId -> Place object
  purchases: {}   // purchaseId -> Purchase object
};

// Load existing state if available
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      state = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading DB file, starting fresh:', err);
  }
}

// Persist state to disk safely
function saveDB() {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

// Initialize on module load
loadDB();

// Generate unique 6-digit room code
function generateRoomCode() {
  let code;
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (Object.values(state.games).some(g => g.roomCode === code && g.status !== 'ENDED') && attempts < 100);
  return code;
}

// Team color accents for visual distinction
const TEAM_COLORS = [
  { name: 'Sakura Pink', code: '#ff758f' },
  { name: 'Samurai Indigo', code: '#3b82f6' },
  { name: 'Emerald Forest', code: '#10b981' },
  { name: 'Imperial Gold', code: '#f59e0b' },
  { name: 'Violet Geisha', code: '#8b5cf6' },
  { name: 'Crimson Torii', code: '#ef4444' },
  { name: 'Teal Onsen', code: '#14b8a6' },
  { name: 'Bronze Pagoda', code: '#d97706' }
];

/**
 * Create a new Game
 */
function createGame({ auctioneerName, numTeams = 4, startingPurse = 100000, customTeamNames = [] }) {
  const gameId = uuidv4();
  const roomCode = generateRoomCode();
  const auctioneerSecret = uuidv4(); // Kept private to creator

  const game = {
    id: gameId,
    roomCode,
    auctioneerSecret,
    auctioneerName: auctioneerName || 'Master Auctioneer',
    startingPurse: Number(startingPurse) || 100000,
    status: 'WAITING', // WAITING, IN_PROGRESS, ENDED
    currentPlaceId: null,
    createdAt: new Date().toISOString(),
    endedAt: null
  };

  state.games[gameId] = game;

  // Initialize Teams
  const teamsCount = Math.max(2, Math.min(Number(numTeams) || 4, 12));
  for (let i = 0; i < teamsCount; i++) {
    const teamId = uuidv4();
    const defaultName = customTeamNames[i] || `Team ${['Sakura', 'Samurai', 'Shogun', 'Ninja', 'Ronin', 'Kitsune', 'Dragon', 'Phoenix'][i] || (i + 1)}`;
    const teamToken = uuidv4();
    const color = TEAM_COLORS[i % TEAM_COLORS.length];

    state.teams[teamId] = {
      id: teamId,
      gameId,
      name: defaultName,
      teamToken,
      color: color.code,
      colorName: color.name,
      startingPurse: game.startingPurse,
      remainingPurse: game.startingPurse,
      isClaimed: false,
      claimedAt: null
    };
  }

  // Pre-seed default Japanese places for this game
  defaultPlaces.forEach((dp, index) => {
    const placeId = uuidv4();
    state.places[placeId] = {
      id: placeId,
      gameId,
      name: dp.name,
      imageUrl: dp.imageUrl,
      location: dp.location,
      description: dp.description || '',
      basePrize: Number(dp.basePrize),
      originalValue: Number(dp.originalValue),
      currentBid: Number(dp.basePrize),
      currentBidderTeamId: null,
      status: 'UPCOMING', // UPCOMING, LIVE, SOLD, UNSOLD
      purchasedPrice: null,
      purchasedByTeamId: null,
      orderIndex: index
    };
  });

  saveDB();
  return { game, auctioneerSecret };
}

/**
 * Find game by Room Code
 */
function getGameByRoomCode(code) {
  if (!code) return null;
  const clean = code.toString().trim();
  return Object.values(state.games).find(g => g.roomCode === clean);
}

/**
 * Validate auctioneer secret
 */
function verifyAuctioneer(gameId, secret) {
  const game = state.games[gameId];
  if (!game) return false;
  return game.auctioneerSecret === secret;
}

/**
 * Get Team by token
 */
function getTeamByToken(teamToken) {
  if (!teamToken) return null;
  return Object.values(state.teams).find(t => t.teamToken === teamToken);
}

/**
 * Calculate team statistics strictly adhering to Section 4:
 * Total Original Value = Sum of original/ref values of places purchased by that team
 * Total Purchased Cost = Sum of final purchased prices of places owned by that team
 * Remaining Purse = Starting Purse - Total Purchased Cost
 * Total Current Team Value = Remaining Purse + Total Original Value
 * Auction Gain = Total Current Team Value - Starting Purse
 */
function calculateTeamStats(teamId) {
  const team = state.teams[teamId];
  if (!team) return null;

  // Find all places owned by this team
  const ownedPlaces = Object.values(state.places).filter(
    p => p.gameId === team.gameId && p.status === 'SOLD' && p.purchasedByTeamId === teamId
  );

  const totalOriginalValue = ownedPlaces.reduce((sum, p) => sum + (Number(p.originalValue) || 0), 0);
  const totalPurchasedCost = ownedPlaces.reduce((sum, p) => sum + (Number(p.purchasedPrice) || 0), 0);
  const remainingPurse = team.startingPurse - totalPurchasedCost;
  const totalCurrentValue = remainingPurse + totalOriginalValue;
  const auctionGain = totalCurrentValue - team.startingPurse;

  // Keep remainingPurse in sync
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
 * Calculate full rankings for the auctioneer
 * Ranks by Total Current Team Value (descending), then Remaining Purse (descending), then Tie
 */
function calculateLeaderboard(gameId) {
  const teams = Object.values(state.teams).filter(t => t.gameId === gameId);
  const statsList = teams.map(t => calculateTeamStats(t.id));

  statsList.sort((a, b) => {
    if (b.totalCurrentValue !== a.totalCurrentValue) {
      return b.totalCurrentValue - a.totalCurrentValue;
    }
    return b.remainingPurse - a.remainingPurse;
  });

  // Assign ranks
  let currentRank = 1;
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

/**
 * Auctioneer Master View (Full Data Access)
 */
function getAuctioneerGameView(gameId) {
  const game = state.games[gameId];
  if (!game) return null;

  const places = Object.values(state.places)
    .filter(p => p.gameId === gameId)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const leaderboard = calculateLeaderboard(gameId);
  const currentPlace = game.currentPlaceId ? state.places[game.currentPlaceId] : null;

  const purchases = Object.values(state.purchases)
    .filter(p => p.gameId === gameId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    game: {
      id: game.id,
      roomCode: game.roomCode,
      auctioneerName: game.auctioneerName,
      startingPurse: game.startingPurse,
      status: game.status,
      currentPlaceId: game.currentPlaceId,
      createdAt: game.createdAt,
      endedAt: game.endedAt
    },
    currentPlace,
    places,
    teams: leaderboard,
    purchases
  };
}

/**
 * Team Public/Restricted View
 * STRICT PRIVACY REQUIREMENT:
 * Teams can see ONLY:
 * - Their own team name & remaining purse
 * - Currently auctioned place
 * - Available places list (UPCOMING or UNSOLD)
 * - Places already purchased by THEIR OWN team (with purchased price & original value)
 * Teams MUST NOT see other teams' purses, spending, purchased places, or valuations!
 */
function getTeamGameView(gameId, teamId) {
  const game = state.games[gameId];
  const team = state.teams[teamId];
  if (!game || !team) return null;

  // Refresh team stats
  const teamStats = calculateTeamStats(teamId);

  // Available places (UPCOMING or UNSOLD)
  const availablePlaces = Object.values(state.places)
    .filter(p => p.gameId === gameId && (p.status === 'UPCOMING' || p.status === 'UNSOLD'))
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(p => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      location: p.location,
      description: p.description,
      basePrize: p.basePrize,
      originalValue: p.originalValue,
      status: p.status
    }));

  // Current place details
  let currentPlace = null;
  if (game.currentPlaceId && state.places[game.currentPlaceId]) {
    const cp = state.places[game.currentPlaceId];
    currentPlace = {
      id: cp.id,
      name: cp.name,
      imageUrl: cp.imageUrl,
      location: cp.location,
      description: cp.description,
      basePrize: cp.basePrize,
      originalValue: cp.originalValue,
      currentBid: cp.currentBid,
      status: cp.status
    };
  }

  // Count total sold & total places for game progress bar
  const allGamePlaces = Object.values(state.places).filter(p => p.gameId === gameId);
  const totalPlacesCount = allGamePlaces.length;
  const soldPlacesCount = allGamePlaces.filter(p => p.status === 'SOLD').length;

  return {
    game: {
      roomCode: game.roomCode,
      status: game.status,
      totalPlacesCount,
      soldPlacesCount
    },
    myTeam: {
      id: team.id,
      name: team.name,
      color: team.color,
      startingPurse: team.startingPurse,
      remainingPurse: teamStats.remainingPurse,
      ownedPlaces: teamStats.ownedPlaces
    },
    currentPlace,
    availablePlaces
  };
}

/**
 * Claim or Register Team
 */
function joinTeam(roomCode, teamNameOrId) {
  const game = getGameByRoomCode(roomCode);
  if (!game) {
    throw new Error('Invalid or expired 6-digit Room OTP.');
  }
  if (game.status === 'ENDED') {
    throw new Error('This auction has already ended.');
  }

  const teamsInGame = Object.values(state.teams).filter(t => t.gameId === game.id);

  // Check if user selected an existing unclaimed team by ID
  let team = teamsInGame.find(t => t.id === teamNameOrId);

  // Or matching by name
  if (!team && teamNameOrId) {
    team = teamsInGame.find(t => t.name.toLowerCase() === teamNameOrId.trim().toLowerCase());
  }

  // If found, claim it
  if (team) {
    team.isClaimed = true;
    team.claimedAt = new Date().toISOString();
    saveDB();
    return { game, team, teamToken: team.teamToken };
  }

  // Otherwise, if any unclaimed team exists, assign or rename it
  const unclaimed = teamsInGame.find(t => !t.isClaimed);
  if (unclaimed) {
    if (teamNameOrId && typeof teamNameOrId === 'string' && teamNameOrId.trim()) {
      unclaimed.name = teamNameOrId.trim();
    }
    unclaimed.isClaimed = true;
    unclaimed.claimedAt = new Date().toISOString();
    saveDB();
    return { game, team: unclaimed, teamToken: unclaimed.teamToken };
  }

  // If all teams claimed, check if max limit reached
  if (teamsInGame.length >= 12) {
    throw new Error('Maximum teams reached for this room.');
  }

  // Create new team dynamically
  const newTeamId = uuidv4();
  const teamToken = uuidv4();
  const color = TEAM_COLORS[teamsInGame.length % TEAM_COLORS.length];
  const newTeam = {
    id: newTeamId,
    gameId: game.id,
    name: (teamNameOrId && teamNameOrId.trim()) || `Team ${teamsInGame.length + 1}`,
    teamToken,
    color: color.code,
    colorName: color.name,
    startingPurse: game.startingPurse,
    remainingPurse: game.startingPurse,
    isClaimed: true,
    claimedAt: new Date().toISOString()
  };

  state.teams[newTeamId] = newTeam;
  saveDB();
  return { game, team: newTeam, teamToken };
}

/**
 * Get available teams for a room code
 */
function getRoomTeams(roomCode) {
  const game = getGameByRoomCode(roomCode);
  if (!game) return null;
  return Object.values(state.teams)
    .filter(t => t.gameId === game.id)
    .map(t => ({
      id: t.id,
      name: t.name,
      color: t.color,
      isClaimed: t.isClaimed
    }));
}

/**
 * Auctioneer Actions
 */

// Add Place
function addPlace(gameId, placeData) {
  const game = state.games[gameId];
  if (!game) throw new Error('Game not found');

  const placeId = uuidv4();
  const existingCount = Object.values(state.places).filter(p => p.gameId === gameId).length;

  const newPlace = {
    id: placeId,
    gameId,
    name: placeData.name.trim(),
    imageUrl: placeData.imageUrl || 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1200&q=80',
    location: placeData.location || 'Japan',
    description: placeData.description || '',
    basePrize: Number(placeData.basePrize) || 10000,
    originalValue: Number(placeData.originalValue) || 30000,
    currentBid: Number(placeData.basePrize) || 10000,
    currentBidderTeamId: null,
    status: 'UPCOMING',
    purchasedPrice: null,
    purchasedByTeamId: null,
    orderIndex: existingCount
  };

  state.places[placeId] = newPlace;
  saveDB();
  return newPlace;
}

// Edit Place
function editPlace(gameId, placeId, updateData) {
  const place = state.places[placeId];
  if (!place || place.gameId !== gameId) throw new Error('Place not found');

  if (updateData.name !== undefined) place.name = updateData.name.trim();
  if (updateData.imageUrl !== undefined) place.imageUrl = updateData.imageUrl;
  if (updateData.location !== undefined) place.location = updateData.location;
  if (updateData.description !== undefined) place.description = updateData.description;
  if (updateData.basePrize !== undefined) place.basePrize = Number(updateData.basePrize);
  if (updateData.originalValue !== undefined) place.originalValue = Number(updateData.originalValue);

  // If still upcoming, reset currentBid to basePrize if requested or lower
  if (place.status === 'UPCOMING' && place.currentBid < place.basePrize) {
    place.currentBid = place.basePrize;
  }

  saveDB();
  return place;
}

// Delete Place
function deletePlace(gameId, placeId) {
  const place = state.places[placeId];
  if (!place || place.gameId !== gameId) throw new Error('Place not found');
  if (place.status === 'SOLD') throw new Error('Cannot delete a sold place. Reopen it first.');

  const game = state.games[gameId];
  if (game && game.currentPlaceId === placeId) {
    game.currentPlaceId = null;
  }

  delete state.places[placeId];
  saveDB();
  return true;
}

// Start Auction for a Place
function startPlaceAuction(gameId, placeId) {
  const game = state.games[gameId];
  const place = state.places[placeId];
  if (!game || !place || place.gameId !== gameId) throw new Error('Place or game not found');

  // If another place was LIVE, mark it UNRESOLVED/UPCOMING or pause it
  if (game.currentPlaceId && game.currentPlaceId !== placeId) {
    const prev = state.places[game.currentPlaceId];
    if (prev && prev.status === 'LIVE') {
      prev.status = 'UPCOMING';
    }
  }

  game.status = 'IN_PROGRESS';
  game.currentPlaceId = placeId;
  place.status = 'LIVE';
  if (!place.currentBid || place.currentBid < place.basePrize) {
    place.currentBid = place.basePrize;
  }

  saveDB();
  return place;
}

// Update Current Bid
function updateCurrentBid(gameId, placeId, bidAmount, bidderTeamId = null) {
  const place = state.places[placeId];
  if (!place || place.gameId !== gameId) throw new Error('Place not found');
  if (place.status !== 'LIVE') throw new Error('Place is not currently in a live auction');

  const amount = Number(bidAmount);
  if (isNaN(amount) || amount < place.basePrize) {
    throw new Error(`Bid amount must be at least the base prize (${place.basePrize.toLocaleString()})`);
  }

  if (bidderTeamId) {
    const team = state.teams[bidderTeamId];
    if (!team) throw new Error('Invalid bidder team');
    const teamStats = calculateTeamStats(bidderTeamId);
    if (amount > teamStats.remainingPurse) {
      throw new Error(`Bid exceeds ${team.name}'s remaining purse (${teamStats.remainingPurse.toLocaleString()})`);
    }
    place.currentBidderTeamId = bidderTeamId;
  }

  place.currentBid = amount;
  saveDB();
  return place;
}

// Confirm Purchase (Mark Sold) - Atomic Transaction with Purse Validation
function confirmPurchase(gameId, placeId, teamId, purchasedPrice) {
  const game = state.games[gameId];
  const place = state.places[placeId];
  const team = state.teams[teamId];

  if (!game || !place || place.gameId !== gameId) throw new Error('Place not found');
  if (!team || team.gameId !== gameId) throw new Error('Team not found');

  // Safety check: Cannot sell if already sold unless reopened
  if (place.status === 'SOLD') {
    throw new Error('This place has already been marked as Sold.');
  }

  const price = Number(purchasedPrice);
  if (isNaN(price) || price <= 0) {
    throw new Error('Purchased price must be a valid positive number');
  }

  // Validate Team Purse
  const teamStats = calculateTeamStats(teamId);
  if (price > teamStats.remainingPurse) {
    throw new Error(`Insufficient funds: ${team.name} has ${teamStats.remainingPurse.toLocaleString()} remaining, but purchase price is ${price.toLocaleString()}.`);
  }

  // Record Purchase in Audit Table
  const purchaseId = uuidv4();
  const purchaseRecord = {
    id: purchaseId,
    gameId,
    placeId,
    teamId,
    purchasedPrice: price,
    timestamp: new Date().toISOString(),
    status: 'CONFIRMED',
    revertedAt: null
  };
  state.purchases[purchaseId] = purchaseRecord;

  // Update Place State
  place.status = 'SOLD';
  place.purchasedPrice = price;
  place.purchasedByTeamId = teamId;
  place.currentBid = price;

  // If this was the current place, clear currentPlaceId or advance
  if (game.currentPlaceId === placeId) {
    game.currentPlaceId = null;
  }

  // Recalculate team stats
  calculateTeamStats(teamId);

  saveDB();
  return { place, purchase: purchaseRecord, teamStats: calculateTeamStats(teamId) };
}

// Mark Place as Unsold
function markPlaceUnsold(gameId, placeId) {
  const game = state.games[gameId];
  const place = state.places[placeId];
  if (!game || !place || place.gameId !== gameId) throw new Error('Place not found');

  place.status = 'UNSOLD';
  place.purchasedPrice = null;
  place.purchasedByTeamId = null;
  place.currentBid = place.basePrize;

  if (game.currentPlaceId === placeId) {
    game.currentPlaceId = null;
  }

  saveDB();
  return place;
}

// Relist / Reset Place to Upcoming
function relistPlace(gameId, placeId) {
  const place = state.places[placeId];
  if (!place || place.gameId !== gameId) throw new Error('Place not found');

  place.status = 'UPCOMING';
  place.currentBid = place.basePrize;
  saveDB();
  return place;
}

// Reopen / Correct an Auction Result (Revert Purchase or Change Buyer/Price)
function reopenAuction(gameId, placeId) {
  const game = state.games[gameId];
  const place = state.places[placeId];
  if (!game || !place || place.gameId !== gameId) throw new Error('Place not found');

  const previousTeamId = place.purchasedByTeamId;

  // Find confirmed purchases for this place and mark reverted
  Object.values(state.purchases)
    .filter(p => p.placeId === placeId && p.status === 'CONFIRMED')
    .forEach(p => {
      p.status = 'REVERTED';
      p.revertedAt = new Date().toISOString();
    });

  place.status = 'UPCOMING';
  place.purchasedPrice = null;
  place.purchasedByTeamId = null;
  place.currentBid = place.basePrize;

  // If previous team existed, recalculate their purse
  if (previousTeamId) {
    calculateTeamStats(previousTeamId);
  }

  saveDB();
  return place;
}

// End Auction and Finalize Leaderboard
function endAuction(gameId) {
  const game = state.games[gameId];
  if (!game) throw new Error('Game not found');

  game.status = 'ENDED';
  game.endedAt = new Date().toISOString();
  game.currentPlaceId = null;

  saveDB();
  return calculateLeaderboard(gameId);
}

// Export functions
module.exports = {
  createGame,
  getGameByRoomCode,
  verifyAuctioneer,
  getTeamByToken,
  joinTeam,
  getRoomTeams,
  calculateTeamStats,
  calculateLeaderboard,
  getAuctioneerGameView,
  getTeamGameView,
  addPlace,
  editPlace,
  deletePlace,
  startPlaceAuction,
  updateCurrentBid,
  confirmPurchase,
  markPlaceUnsold,
  relistPlace,
  reopenAuction,
  endAuction,
  state
};
