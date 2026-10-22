import { io } from 'socket.io-client';

// Determine backend URL intelligently
// If VITE_API_URL is configured, use it.
// If running on Vite dev server (e.g. port 5173), target the Node backend on port 5000.
// Otherwise, use current origin (for unified Express deployment or Vercel serverless).
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '5173') {
      return `${protocol}//${hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();
const API_BASE = `${BACKEND_URL}/api`;

// Socket singleton
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000
    });
  }
  return socket;
}

// Safe response parser that prevents "Unexpected token < or T in JSON"
async function handleResponse(res, fallbackMessage) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    // If not JSON (e.g. 404 HTML page, 502 Bad Gateway, or proxy error)
    if (!res.ok) {
      throw new Error(
        `Server communication error (${res.status} ${res.statusText}). Please check that the backend server is running.`
      );
    }
    throw new Error(`Unexpected non-JSON response from server: ${text.slice(0, 100)}...`);
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || fallbackMessage || `Request failed with status ${res.status}`);
  }
  return data;
}

// 1. Create Game
export async function createGame(payload) {
  try {
    const res = await fetch(`${API_BASE}/games/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await handleResponse(res, 'Failed to create auction');
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Make sure "npm run dev" or "npm start" is running on port 5000.');
    }
    throw err;
  }
}

// 2. Get Teams for Room
export async function getRoomTeams(roomCode) {
  try {
    const res = await fetch(`${API_BASE}/games/${roomCode}/teams`);
    const data = await handleResponse(res, 'Room not found');
    return data.teams;
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Check server connection.');
    }
    throw err;
  }
}

// 3. Join Game as Team
export async function joinGame(roomCode, teamNameOrId) {
  try {
    const res = await fetch(`${API_BASE}/games/${roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamNameOrId })
    });
    return await handleResponse(res, 'Failed to join auction');
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to backend server.');
    }
    throw err;
  }
}

// 4. Auctioneer Master State
export async function fetchAuctioneerState(gameId, secret) {
  const res = await fetch(`${API_BASE}/auctioneer/state`, {
    headers: {
      'x-game-id': gameId,
      'x-auctioneer-secret': secret
    }
  });
  return await handleResponse(res, 'Failed to fetch auctioneer state');
}

// 5. Team Filtered State
export async function fetchTeamState(teamToken) {
  const res = await fetch(`${API_BASE}/team/state`, {
    headers: {
      'x-team-token': teamToken
    }
  });
  return await handleResponse(res, 'Failed to fetch team state');
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
  return await handleResponse(res, 'Auctioneer operation failed');
}
