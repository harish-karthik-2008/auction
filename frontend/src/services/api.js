import { io } from 'socket.io-client';

const API_BASE = '/api';

// Socket singleton
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });
  }
  return socket;
}

// 1. Create Game
export async function createGame(payload) {
  const res = await fetch(`${API_BASE}/games/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create auction');
  return data;
}

// 2. Get Teams for Room
export async function getRoomTeams(roomCode) {
  const res = await fetch(`${API_BASE}/games/${roomCode}/teams`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Room not found');
  return data.teams;
}

// 3. Join Game as Team
export async function joinGame(roomCode, teamNameOrId) {
  const res = await fetch(`${API_BASE}/games/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamNameOrId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join auction');
  return data;
}

// 4. Auctioneer Master State
export async function fetchAuctioneerState(gameId, secret) {
  const res = await fetch(`${API_BASE}/auctioneer/state`, {
    headers: {
      'x-game-id': gameId,
      'x-auctioneer-secret': secret
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch auctioneer state');
  return data;
}

// 5. Team Filtered State
export async function fetchTeamState(teamToken) {
  const res = await fetch(`${API_BASE}/team/state`, {
    headers: {
      'x-team-token': teamToken
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch team state');
  return data;
}

// 6. Auctioneer Actions
export async function auctioneerAction(endpoint, method = 'POST', gameId, secret, body = null) {
  const headers = {
    'x-game-id': gameId,
    'x-auctioneer-secret': secret,
    'Content-Type': 'application/json'
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}/auctioneer/${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Auctioneer operation failed');
  return data;
}
