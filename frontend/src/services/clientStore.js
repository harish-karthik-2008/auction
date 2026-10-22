// Client-Side In-Browser Auction Engine
// Provides full offline/serverless persistence and cross-tab real-time synchronization
// when deployed on static hosts like Vercel without a dedicated backend server.

import { defaultPlacesList } from './defaultPlacesList';

const STORAGE_KEY = 'jp_auction_arena_db_v1';
const BROADCAST_CHANNEL = 'jp_auction_arena_channel';

let channel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  channel = new BroadcastChannel(BROADCAST_CHANNEL);
}

// In-memory state
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load local DB', e);
  }
  return { games: {}, teams: {}, places: {}, purchases: {} };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (channel) {
      channel.postMessage({ type: 'SYNC_STATE', timestamp: Date.now() });
    }
  } catch (e) {
    console.error('Failed to save local DB', e);
  }
}

function generateId() {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function generateRoomCode(state) {
  let code;
  let attempts = 0;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (Object.values(state.games).some(g => g.roomCode === code && g.status !== 'ENDED') && attempts < 100);
  return code;
}

const TEAM_COLORS = [
  '#ff758f', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#d97706'
];

export const clientStore = {
  createGame({ auctioneerName = 'Master Auctioneer', numTeams = 4, startingPurse = 100000, customTeamNames = [] }) {
    const state = loadState();
    const gameId = generateId();
    const roomCode = generateRoomCode(state);
    const auctioneerSecret = generateId();

    const game = {
      id: gameId,
      roomCode,
      auctioneerSecret,
      auctioneerName,
      startingPurse: Number(startingPurse) || 100000,
      status: 'WAITING',
      currentPlaceId: null,
      createdAt: new Date().toISOString(),
      endedAt: null
    };
    state.games[gameId] = game;

    // Teams
    const count = Math.max(2, Math.min(Number(numTeams) || 4, 8));
    for (let i = 0; i < count; i++) {
      const teamId = generateId();
      const defaultName = customTeamNames[i] || `Team ${['Sakura', 'Samurai', 'Shogun', 'Ninja', 'Ronin', 'Kitsune', 'Dragon', 'Phoenix'][i] || (i + 1)}`;
      const teamToken = generateId();
      state.teams[teamId] = {
        id: teamId,
        gameId,
        name: defaultName,
        teamToken,
        color: TEAM_COLORS[i % TEAM_COLORS.length],
        startingPurse: game.startingPurse,
        remainingPurse: game.startingPurse,
        isClaimed: false,
        claimedAt: null
      };
    }

    // Places
    defaultPlacesList.forEach((dp, idx) => {
      const placeId = generateId();
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
        status: 'UPCOMING',
        purchasedPrice: null,
        purchasedByTeamId: null,
        orderIndex: idx
      };
    });

    saveState(state);
    return {
      success: true,
      gameId: game.id,
      roomCode: game.roomCode,
      auctioneerSecret,
      auctioneerName: game.auctioneerName,
      startingPurse: game.startingPurse
    };
  },

  getRoomTeams(roomCode) {
    const state = loadState();
    const game = Object.values(state.games).find(g => g.roomCode === roomCode.trim());
    if (!game) throw new Error('Invalid or inactive Room OTP code.');
    return Object.values(state.teams)
      .filter(t => t.gameId === game.id)
      .map(t => ({
        id: t.id,
        name: t.name,
        color: t.color,
        isClaimed: t.isClaimed
      }));
  },

  joinGame(roomCode, teamNameOrId) {
    const state = loadState();
    const game = Object.values(state.games).find(g => g.roomCode === roomCode.trim());
    if (!game) throw new Error('Invalid or expired 6-digit Room OTP.');
    if (game.status === 'ENDED') throw new Error('This auction has already ended.');

    const teams = Object.values(state.teams).filter(t => t.gameId === game.id);
    let team = teams.find(t => t.id === teamNameOrId);
    if (!team && teamNameOrId) {
      team = teams.find(t => t.name.toLowerCase() === teamNameOrId.trim().toLowerCase());
    }

    if (team) {
      team.isClaimed = true;
      team.claimedAt = new Date().toISOString();
      saveState(state);
      return {
        success: true,
        gameId: game.id,
        roomCode: game.roomCode,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        teamToken: team.teamToken
      };
    }

    const unclaimed = teams.find(t => !t.isClaimed);
    if (unclaimed) {
      if (teamNameOrId && teamNameOrId.trim()) unclaimed.name = teamNameOrId.trim();
      unclaimed.isClaimed = true;
      unclaimed.claimedAt = new Date().toISOString();
      saveState(state);
      return {
        success: true,
        gameId: game.id,
        roomCode: game.roomCode,
        teamId: unclaimed.id,
        teamName: unclaimed.name,
        teamColor: unclaimed.color,
        teamToken: unclaimed.teamToken
      };
    }

    throw new Error('All teams in this room have already been claimed.');
  },

  calculateTeamStats(state, teamId) {
    const team = state.teams[teamId];
    if (!team) return null;
    const ownedPlaces = Object.values(state.places).filter(
      p => p.gameId === team.gameId && p.status === 'SOLD' && p.purchasedByTeamId === teamId
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
  },

  calculateLeaderboard(state, gameId) {
    const teams = Object.values(state.teams).filter(t => t.gameId === gameId);
    const statsList = teams.map(t => this.calculateTeamStats(state, t.id));
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
  },

  getAuctioneerState(gameId) {
    const state = loadState();
    const game = state.games[gameId];
    if (!game) throw new Error('Game not found');

    const places = Object.values(state.places)
      .filter(p => p.gameId === gameId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const leaderboard = this.calculateLeaderboard(state, gameId);
    const currentPlace = game.currentPlaceId ? state.places[game.currentPlaceId] : null;

    return {
      game: { ...game },
      currentPlace,
      places,
      teams: leaderboard,
      purchases: Object.values(state.purchases).filter(p => p.gameId === gameId)
    };
  },

  getTeamState(teamToken) {
    const state = loadState();
    const team = Object.values(state.teams).find(t => t.teamToken === teamToken);
    if (!team) throw new Error('Team not found');
    const game = state.games[team.gameId];
    if (!game) throw new Error('Game not found');

    const teamStats = this.calculateTeamStats(state, team.id);
    const availablePlaces = Object.values(state.places)
      .filter(p => p.gameId === game.id && (p.status === 'UPCOMING' || p.status === 'UNSOLD'))
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

    const allPlaces = Object.values(state.places).filter(p => p.gameId === game.id);
    return {
      game: {
        roomCode: game.roomCode,
        status: game.status,
        totalPlacesCount: allPlaces.length,
        soldPlacesCount: allPlaces.filter(p => p.status === 'SOLD').length
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
  },

  auctioneerAction(endpoint, gameId, body) {
    const state = loadState();
    const game = state.games[gameId];
    if (!game) throw new Error('Game not found');

    // places/:placeId/start
    if (endpoint.includes('/start')) {
      const placeId = endpoint.split('/')[1];
      const place = state.places[placeId];
      if (place) {
        if (game.currentPlaceId && state.places[game.currentPlaceId]) {
          if (state.places[game.currentPlaceId].status === 'LIVE') {
            state.places[game.currentPlaceId].status = 'UPCOMING';
          }
        }
        game.status = 'IN_PROGRESS';
        game.currentPlaceId = placeId;
        place.status = 'LIVE';
        if (!place.currentBid || place.currentBid < place.basePrize) {
          place.currentBid = place.basePrize;
        }
        saveState(state);
        return { success: true, place };
      }
    }

    // places/:placeId/bid
    if (endpoint.includes('/bid')) {
      const placeId = endpoint.split('/')[1];
      const place = state.places[placeId];
      if (place && place.status === 'LIVE') {
        place.currentBid = Number(body.bidAmount);
        saveState(state);
        return { success: true, place };
      }
    }

    // places/:placeId/sell
    if (endpoint.includes('/sell')) {
      const placeId = endpoint.split('/')[1];
      const place = state.places[placeId];
      const { teamId, purchasedPrice } = body;
      const team = state.teams[teamId];

      // If already sold, revert previous team purchase first
      if (place.status === 'SOLD') {
        const prevTeamId = place.purchasedByTeamId;
        Object.values(state.purchases)
          .filter(p => p.placeId === placeId && p.status === 'CONFIRMED')
          .forEach(p => { p.status = 'REVERTED'; });
        if (prevTeamId) this.calculateTeamStats(state, prevTeamId);
      }

      const stats = this.calculateTeamStats(state, teamId);
      if (Number(purchasedPrice) > stats.remainingPurse) {
        throw new Error(`Insufficient funds: ${team.name} only has ${stats.remainingPurse.toLocaleString()} pts.`);
      }
      const purchaseId = generateId();
      state.purchases[purchaseId] = {
        id: purchaseId,
        gameId,
        placeId,
        teamId,
        purchasedPrice: Number(purchasedPrice),
        timestamp: new Date().toISOString(),
        status: 'CONFIRMED'
      };
      place.status = 'SOLD';
      place.purchasedPrice = Number(purchasedPrice);
      place.purchasedByTeamId = teamId;
      place.currentBid = Number(purchasedPrice);
      game.currentPlaceId = null;
      this.calculateTeamStats(state, teamId);
      saveState(state);
      return { success: true, place };
    }

    // places/:placeId/unsold
    if (endpoint.includes('/unsold')) {
      const placeId = endpoint.split('/')[1];
      const place = state.places[placeId];
      if (place) {
        place.status = 'UNSOLD';
        place.purchasedPrice = null;
        place.purchasedByTeamId = null;
        place.currentBid = place.basePrize;
        game.currentPlaceId = null;
        saveState(state);
        return { success: true, place };
      }
    }

    // places/:placeId/reopen
    if (endpoint.includes('/reopen')) {
      const placeId = endpoint.split('/')[1];
      const place = state.places[placeId];
      if (place) {
        const prevTeamId = place.purchasedByTeamId;
        place.status = 'UPCOMING';
        place.purchasedPrice = null;
        place.purchasedByTeamId = null;
        place.currentBid = place.basePrize;
        if (prevTeamId) this.calculateTeamStats(state, prevTeamId);
        saveState(state);
        return { success: true, place };
      }
    }

    // places/:placeId/relist
    if (endpoint.includes('/relist')) {
      const placeId = endpoint.split('/')[1];
      const place = state.places[placeId];
      if (place) {
        place.status = 'UPCOMING';
        place.currentBid = place.basePrize;
        saveState(state);
        return { success: true, place };
      }
    }

    // places/add
    if (endpoint === 'places/add') {
      const placeId = generateId();
      const count = Object.values(state.places).filter(p => p.gameId === gameId).length;
      const newPlace = {
        id: placeId,
        gameId,
        name: body.name.trim(),
        imageUrl: body.imageUrl,
        location: body.location,
        description: body.description || '',
        basePrize: Number(body.basePrize) || 10000,
        originalValue: Number(body.originalValue) || 30000,
        currentBid: Number(body.basePrize) || 10000,
        currentBidderTeamId: null,
        status: 'UPCOMING',
        purchasedPrice: null,
        purchasedByTeamId: null,
        orderIndex: count
      };
      state.places[placeId] = newPlace;
      saveState(state);
      return { success: true, place: newPlace };
    }

    // end
    if (endpoint === 'end') {
      game.status = 'ENDED';
      game.endedAt = new Date().toISOString();
      game.currentPlaceId = null;
      const leaderboard = this.calculateLeaderboard(state, gameId);
      saveState(state);
      return { success: true, leaderboard };
    }

    throw new Error('Unknown operation');
  }
};
