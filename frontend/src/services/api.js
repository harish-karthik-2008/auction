import { io } from 'socket.io-client';
import { clientStore } from './clientStore';

// Determine backend URL intelligently
const getBackendUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    // Check if user set custom backend in localStorage
    const savedCustomUrl = localStorage.getItem('jp_custom_backend_url');
    if (savedCustomUrl) return savedCustomUrl.replace(/\/$/, '');

    const { hostname, port, protocol } = window.location;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '5173') {
      return `${protocol}//${hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

let BACKEND_URL = getBackendUrl();
let API_BASE = `${BACKEND_URL}/api`;

// Helper: Safely parse JSON without throwing "Unexpected end of JSON input"
async function safeJson(res) {
  if (!res) return null;
  const contentType = res.headers ? (res.headers.get('content-type') || '') : '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  try {
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

// Hybrid Socket & BroadcastChannel dispatcher
let realSocket = null;
const eventListeners = {};

let broadcastChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  broadcastChannel = new BroadcastChannel('jp_auction_arena_channel');
  broadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'SYNC_STATE') {
      triggerLocalStateRefresh();
    }
  };
}

let activeRoleSession = null;

function triggerLocalStateRefresh() {
  if (!activeRoleSession) return;
  try {
    if (activeRoleSession.role === 'auctioneer' && activeRoleSession.gameId) {
      const state = clientStore.getAuctioneerState(activeRoleSession.gameId);
      emitLocalEvent('auctioneer:state', state);
    } else if (activeRoleSession.role === 'team' && activeRoleSession.teamToken) {
      const state = clientStore.getTeamState(activeRoleSession.teamToken);
      emitLocalEvent('team:state', state);
    }
  } catch (e) {
    // Session state
  }
}

function emitLocalEvent(event, data) {
  if (eventListeners[event]) {
    eventListeners[event].forEach(cb => cb(data));
  }
}

export function getSocket() {
  if (!realSocket) {
    try {
      realSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 4000
      });

      realSocket.on('auctioneer:state', (data) => emitLocalEvent('auctioneer:state', data));
      realSocket.on('team:state', (data) => emitLocalEvent('team:state', data));
    } catch (e) {
      console.warn('Socket.IO initialization failed, using in-browser synchronization:', e);
    }
  }

  return {
    emit(event, payload) {
      if (event === 'join:auctioneer') {
        activeRoleSession = { role: 'auctioneer', gameId: payload.gameId };
      } else if (event === 'join:team') {
        activeRoleSession = { role: 'team', teamToken: payload.teamToken };
      }
      if (realSocket && realSocket.connected) {
        realSocket.emit(event, payload);
      }
    },
    on(event, callback) {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(callback);
    },
    off(event, callback) {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
      }
    }
  };
}

// 1. Create Game
export async function createGame(payload) {
  try {
    const res = await fetch(`${API_BASE}/games/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await safeJson(res);
    if (res.ok && data) {
      return data;
    }
  } catch (err) {
    console.warn('Backend unavailable, using in-browser store:', err);
  }

  const localResult = clientStore.createGame(payload);
  activeRoleSession = { role: 'auctioneer', gameId: localResult.gameId };
  return localResult;
}

// 2. Get Teams for Room
export async function getRoomTeams(roomCode) {
  try {
    const res = await fetch(`${API_BASE}/games/${roomCode}/teams`);
    const data = await safeJson(res);
    if (res.ok && data && data.teams) {
      return data.teams;
    }
  } catch (err) {
    // Fallback
  }

  try {
    return clientStore.getRoomTeams(roomCode);
  } catch (e) {
    throw new Error(`Room code "${roomCode}" was not found. If joining from another device, ensure both devices are connected to the same server.`);
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
    const data = await safeJson(res);
    if (res.ok && data && data.teamToken) {
      return data;
    }
  } catch (err) {
    // Fallback
  }

  try {
    const localResult = clientStore.joinGame(roomCode, teamNameOrId);
    activeRoleSession = { role: 'team', teamToken: localResult.teamToken };
    return localResult;
  } catch (e) {
    throw new Error(`Room code "${roomCode}" not found. If this room was created on your computer, both devices must be on the same server to play together.`);
  }
}

// 4. Fetch Auctioneer State
export async function fetchAuctioneerState(gameId, secret) {
  try {
    const res = await fetch(`${API_BASE}/auctioneer/state`, {
      headers: { 'x-game-id': gameId, 'x-auctioneer-secret': secret }
    });
    const data = await safeJson(res);
    if (res.ok && data) {
      return data;
    }
  } catch (err) {
    // Fallback
  }

  activeRoleSession = { role: 'auctioneer', gameId };
  return clientStore.getAuctioneerState(gameId);
}

// 5. Fetch Team State
export async function fetchTeamState(teamToken) {
  try {
    const res = await fetch(`${API_BASE}/team/state`, {
      headers: { 'x-team-token': teamToken }
    });
    const data = await safeJson(res);
    if (res.ok && data) {
      return data;
    }
  } catch (err) {
    // Fallback
  }

  activeRoleSession = { role: 'team', teamToken };
  return clientStore.getTeamState(teamToken);
}

// 6. Auctioneer Actions
export async function auctioneerAction(endpoint, method = 'POST', gameId, secret, body = null) {
  try {
    const headers = {
      'x-game-id': gameId,
      'x-auctioneer-secret': secret,
      'Content-Type': 'application/json'
    };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}/auctioneer/${endpoint}`, options);
    const data = await safeJson(res);
    if (res.ok && data) {
      return data;
    }
  } catch (err) {
    // Fallback
  }

  const localRes = clientStore.auctioneerAction(endpoint, gameId, body);
  triggerLocalStateRefresh();
  return localRes;
}
