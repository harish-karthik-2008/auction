import React, { useState, useEffect, useMemo } from 'react';
import {
  Gavel,
  Plus,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  Coins,
  Shield,
  Sparkles,
  Edit2,
  Trash2,
  ShoppingBag,
  Clock,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Crown
} from 'lucide-react';
import PetalBackground from './components/PetalBackground';
import PlaceModal from './components/PlaceModal';
import WinnerModal from './components/WinnerModal';
import {
  loadAuctionState,
  saveAuctionState,
  createInitialState,
  resetToOfficialCatalog,
  calculateLeaderboard,
  calculateTeamStats
} from './store/auctionStore';

export default function App() {
  const [state, setState] = useState(() => loadAuctionState());
  const [activeView, setActiveView] = useState('places'); // 'places', 'ledger'
  const [placeFilter, setPlaceFilter] = useState('ALL'); // 'ALL', 'AVAILABLE', 'SOLD', 'UNSOLD'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Direct Mark-as-Purchased Modal State
  const [sellingPlace, setSellingPlace] = useState(null);
  const [buyerTeamId, setBuyerTeamId] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Configuration modal state
  const [configNumTeams, setConfigNumTeams] = useState(state.teams.length || 12);
  const [configPurse, setConfigPurse] = useState(state.startingPurse || 30000000);
  const [configAuctioneerName, setConfigAuctioneerName] = useState(state.auctioneerName || 'Master Auctioneer');

  // Auto-persist state changes
  useEffect(() => {
    saveAuctionState(state);
  }, [state]);

  // Derived statistics & leaderboard
  const leaderboard = useMemo(() => calculateLeaderboard(state), [state]);
  const soldCount = state.places.filter(p => p.status === 'SOLD').length;
  const availableCount = state.places.filter(p => p.status === 'AVAILABLE').length;

  // Filtered & searched places
  const displayedPlaces = useMemo(() => {
    return state.places.filter(p => {
      // Filter tab
      if (placeFilter === 'AVAILABLE' && p.status !== 'AVAILABLE') return false;
      if (placeFilter === 'SOLD' && p.status !== 'SOLD') return false;
      if (placeFilter === 'UNSOLD' && p.status !== 'UNSOLD') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchLocation = p.location.toLowerCase().includes(query);
        return matchName || matchLocation;
      }
      return true;
    });
  }, [state.places, placeFilter, searchQuery]);

  // Open the "Mark as Purchased" Modal
  const handleOpenSellModal = (place) => {
    setErrorMessage('');
    setSellingPlace(place);
    setBuyerTeamId(place.purchasedByTeamId || state.teams[0]?.id || '');
    setCustomPrice(place.purchasedPrice || place.basePrize);
  };

  // Confirm Purchase (Admin marks which place purchased by which team)
  const handleConfirmPurchase = () => {
    if (!sellingPlace) return;
    if (!buyerTeamId) {
      setErrorMessage('Please choose which team purchased this landmark.');
      return;
    }
    const price = Number(customPrice);
    if (!price || price <= 0) {
      setErrorMessage('Please enter a valid purchase price.');
      return;
    }

    const teamStats = leaderboard.find(t => t.teamId === buyerTeamId);
    // If reassigning to same team, add back existing price for purse check
    const currentPriceCredit = (sellingPlace.status === 'SOLD' && sellingPlace.purchasedByTeamId === buyerTeamId)
      ? Number(sellingPlace.purchasedPrice)
      : 0;

    const availablePurse = (teamStats?.remainingPurse || 0) + currentPriceCredit;

    if (price > availablePurse) {
      setErrorMessage(`Insufficient funds: ${teamStats?.teamName} only has ¥${availablePurse.toLocaleString()} available.`);
      return;
    }

    // Update state
    setState(prev => {
      const updatedPlaces = prev.places.map(p => {
        if (p.id === sellingPlace.id) {
          return {
            ...p,
            status: 'SOLD',
            purchasedPrice: price,
            purchasedByTeamId: buyerTeamId
          };
        }
        return p;
      });

      return {
        ...prev,
        places: updatedPlaces
      };
    });

    setSellingPlace(null);
    setBuyerTeamId('');
    setCustomPrice('');
    setErrorMessage('');
  };

  // Reopen Place (Refunds team and sets back to Available)
  const handleReopenPlace = (placeId) => {
    setState(prev => ({
      ...prev,
      places: prev.places.map(p => {
        if (p.id === placeId) {
          return {
            ...p,
            status: 'AVAILABLE',
            purchasedPrice: null,
            purchasedByTeamId: null
          };
        }
        return p;
      })
    }));
  };

  // Mark place as Unsold
  const handleMarkUnsold = (placeId) => {
    setState(prev => ({
      ...prev,
      places: prev.places.map(p => {
        if (p.id === placeId) {
          return {
            ...p,
            status: 'UNSOLD',
            purchasedPrice: null,
            purchasedByTeamId: null
          };
        }
        return p;
      })
    }));
  };

  // Relist place to Available
  const handleRelist = (placeId) => {
    setState(prev => ({
      ...prev,
      places: prev.places.map(p => {
        if (p.id === placeId) {
          return { ...p, status: 'AVAILABLE' };
        }
        return p;
      })
    }));
  };

  // Save place (Create or Edit)
  const handleSavePlace = (placeData) => {
    setState(prev => {
      if (editingPlace) {
        return {
          ...prev,
          places: prev.places.map(p => (p.id === editingPlace.id ? { ...p, ...placeData } : p))
        };
      } else {
        const newPlace = {
          id: 'id_' + Math.random().toString(36).substring(2, 9),
          ...placeData,
          status: 'AVAILABLE',
          purchasedPrice: null,
          purchasedByTeamId: null,
          orderIndex: prev.places.length
        };
        return {
          ...prev,
          places: [...prev.places, newPlace]
        };
      }
    });
    setIsPlaceModalOpen(false);
    setEditingPlace(null);
  };

  // Delete place
  const handleDeletePlace = (placeId) => {
    if (!window.confirm('Are you sure you want to delete this landmark?')) return;
    setState(prev => ({
      ...prev,
      places: prev.places.filter(p => p.id !== placeId)
    }));
  };

  // Reset or Reconfigure Tournament
  const handleApplyConfig = (e) => {
    e.preventDefault();
    if (window.confirm('Resetting tournament will clear current purchases and start fresh. Proceed?')) {
      const fresh = createInitialState(configNumTeams, configPurse, configAuctioneerName);
      setState(fresh);
      setIsConfigModalOpen(false);
    }
  };

  const selectedBuyerTeam = state.teams.find(t => t.id === buyerTeamId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient Sakura Petal Animation */}
      <PetalBackground />

      {/* Top Header */}
      <header style={{
        padding: '16px 24px',
        background: 'rgba(10, 17, 40, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ff758f 0%, #e63946 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 18px rgba(255, 117, 143, 0.4)'
          }}>
            <img src="/icon.svg" alt="Torii" style={{ width: '30px', height: '30px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.25rem', color: '#ffffff' }}>
                JAPAN PLACES
              </span>
              <span style={{
                background: 'linear-gradient(90deg, #ff758f, #ffd166)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 900,
                fontSize: '1.25rem'
              }}>
                AUCTION ARENA
              </span>
              <span style={{ fontSize: '1.2rem' }}>🇯🇵</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--sakura-light)', fontFamily: 'var(--font-serif)', letterSpacing: '0.12em', margin: 0 }}>
              主催者専用管理ポータル • AUCTIONEER MASTER ARENA
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (window.confirm('Reset catalog to official 30 Japanese cities with tiered prices (¥3M, ¥2M, ¥1M) and 12 teams?')) {
                const fresh = resetToOfficialCatalog();
                setState(fresh);
              }
            }}
            className="btn-navy"
            style={{ padding: '8px 16px', fontSize: '0.85rem', border: '1px solid rgba(255, 117, 143, 0.4)' }}
            title="Reload official 30 cities with ¥3M/¥2M/¥1M base prizes and 12 teams"
          >
            <RotateCcw size={15} color="var(--sakura-primary)" />
            <span>Reset Official 30 Cities</span>
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="btn-navy"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <SlidersHorizontal size={15} />
            <span>Configure Teams & Purse</span>
          </button>

          <button
            onClick={() => { setEditingPlace(null); setIsPlaceModalOpen(true); }}
            className="btn-navy"
            style={{ padding: '8px 16px', fontSize: '0.85rem', border: '1px solid rgba(255, 117, 143, 0.4)' }}
          >
            <Plus size={16} color="var(--sakura-primary)" />
            <span>Add Destination</span>
          </button>

          <button
            onClick={() => setIsWinnerModalOpen(true)}
            className="btn-gold"
            style={{ padding: '8px 18px', fontSize: '0.88rem' }}
          >
            <Trophy size={16} />
            <span>End & Crown Winner</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px 20px', maxWidth: '1300px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Teams Live Purse Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '26px'
        }}>
          {leaderboard.map((team) => (
            <div
              key={team.teamId}
              className="glass-panel"
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                borderLeft: `4px solid ${team.color}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.98rem' }}>
                  {team.teamName}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: team.rank === 1 ? '#ffd166' : 'var(--text-muted)'
                }}>
                  #{team.rank} {team.isTied && '(Tie)'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Remaining Purse
                </span>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  color: '#34d399',
                  letterSpacing: '0.02em'
                }}>
                  ¥{team.remainingPurse.toLocaleString()}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <span>Acquired: <strong style={{ color: '#ffffff' }}>{team.placesPurchasedCount}</strong></span>
                <span>Gain: <strong style={{ color: team.auctionGain >= 0 ? '#34d399' : '#f87171' }}>{team.auctionGain >= 0 ? '+' : ''}¥{team.auctionGain.toLocaleString()}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* View Switcher Tabs & Search Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setActiveView('places')}
              style={{
                background: activeView === 'places' ? 'var(--sakura-primary)' : 'rgba(10, 17, 40, 0.6)',
                color: activeView === 'places' ? '#ffffff' : 'var(--text-secondary)',
                border: activeView === 'places' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 22px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MapPin size={16} />
              <span>Japan Places & Direct Purchase Marking ({state.places.length})</span>
            </button>

            <button
              onClick={() => setActiveView('ledger')}
              style={{
                background: activeView === 'ledger' ? 'var(--sakura-primary)' : 'rgba(10, 17, 40, 0.6)',
                color: activeView === 'ledger' ? '#ffffff' : 'var(--text-secondary)',
                border: activeView === 'ledger' ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                padding: '10px 22px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Users size={16} />
              <span>Teams Valuation & Rankings ({state.teams.length})</span>
            </button>
          </div>

          {/* Search Input */}
          {activeView === 'places' && (
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="jp-input"
                style={{ paddingLeft: '36px', paddingBottom: '8px', paddingTop: '8px', fontSize: '0.85rem' }}
                placeholder="Search landmark or prefecture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* VIEW 1: PLACES & DIRECT PURCHASE MARKING */}
        {activeView === 'places' && (
          <div>
            {/* Filter Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'All Places', value: 'ALL' },
                  { label: `Available (${availableCount})`, value: 'AVAILABLE' },
                  { label: `Sold / Purchased (${soldCount})`, value: 'SOLD' },
                  { label: 'Unsold', value: 'UNSOLD' }
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setPlaceFilter(f.value)}
                    style={{
                      background: placeFilter === f.value ? 'rgba(255, 117, 143, 0.25)' : 'rgba(10, 17, 40, 0.6)',
                      border: placeFilter === f.value ? '1px solid var(--sakura-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: placeFilter === f.value ? '#ffffff' : 'var(--text-secondary)',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Click <strong style={{ color: 'var(--sakura-light)' }}>"Mark Purchased by Team"</strong> to assign any landmark to a team!
              </div>
            </div>

            {/* Places Grid */}
            <div className="places-grid">
              {displayedPlaces.map((place) => {
                const buyerTeam = state.teams.find(t => t.id === place.purchasedByTeamId);
                const isSold = place.status === 'SOLD';

                return (
                  <div
                    key={place.id}
                    className="glass-panel"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      border: isSold ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid var(--navy-border)',
                      boxShadow: isSold ? '0 8px 25px rgba(16, 185, 129, 0.12)' : 'var(--shadow-card)'
                    }}
                  >
                    {/* Photo */}
                    <div style={{ height: '190px', position: 'relative' }}>
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <span className={`badge-status badge-${place.status.toLowerCase()}`}>
                          {isSold ? '✓ SOLD' : place.status}
                        </span>
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(7, 13, 30, 0.95) 0%, transparent 100%)',
                        padding: '12px 14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sakura-light)', fontSize: '0.75rem' }}>
                          <MapPin size={12} />
                          <span>{place.location}</span>
                        </div>
                        <h4 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.1rem', margin: '2px 0 0' }}>
                          {place.name}
                        </h4>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        {/* Price metrics */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '8px',
                          background: 'rgba(10, 17, 40, 0.6)',
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Base Starting Prize
                            </span>
                            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.98rem' }}>
                              ¥{Number(place.basePrize).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Reference Value
                            </span>
                            <div style={{ fontWeight: 800, color: '#93c5fd', fontSize: '0.98rem' }}>
                              ¥{Number(place.originalValue).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Sold Banner */}
                        {isSold && (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '14px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: buyerTeam?.color || '#34d399'
                              }} />
                              <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.92rem' }}>
                                Purchased by {buyerTeam?.name || 'Unknown Team'}
                              </span>
                            </div>
                            <div style={{ color: '#ffffff', fontSize: '0.85rem', marginTop: '2px', fontWeight: 600 }}>
                              Price: ¥{Number(place.purchasedPrice).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {!isSold ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenSellModal(place)}
                              className="btn-sakura"
                              style={{ flex: 2, padding: '10px 12px', fontSize: '0.85rem' }}
                            >
                              <CheckCircle2 size={16} />
                              <span>Mark Purchased by Team</span>
                            </button>

                            {place.status !== 'UNSOLD' ? (
                              <button
                                type="button"
                                onClick={() => handleMarkUnsold(place.id)}
                                className="btn-navy"
                                style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                                title="Mark Unsold"
                              >
                                <XCircle size={15} />
                                <span>Unsold</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRelist(place.id)}
                                className="btn-navy"
                                style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#ffd166' }}
                                title="Relist to Available"
                              >
                                <RotateCcw size={15} />
                                <span>Relist</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenSellModal(place)}
                              className="btn-navy"
                              style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', color: '#93c5fd' }}
                              title="Change buyer team or price"
                            >
                              <Edit2 size={14} />
                              <span>Change Buyer / Price</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReopenPlace(place.id)}
                              className="btn-navy"
                              style={{ padding: '8px 12px', fontSize: '0.82rem', color: '#ffd166' }}
                              title="Revert sale and refund team purse"
                            >
                              <RotateCcw size={14} />
                              <span>Reopen</span>
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => { setEditingPlace(place); setIsPlaceModalOpen(true); }}
                          className="btn-navy"
                          style={{ padding: '8px' }}
                          title="Edit Details"
                        >
                          <Edit2 size={14} />
                        </button>

                        {!isSold && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlace(place.id)}
                            className="btn-navy"
                            style={{ padding: '8px', color: '#f87171' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: TEAMS MASTER VALUATION LEDGER */}
        {activeView === 'ledger' && (
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: '#ffffff' }}>
                  Teams Financial & Valuation Master Ledger
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Evaluates Total Current Value = Remaining Purse + Total Original Value. Real-time ranking with tie-breakers.
                </p>
              </div>
              <div className="hanko-stamp">採点台帳</div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{
                    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--sakura-light)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase'
                  }}>
                    <th style={{ padding: '12px 10px' }}>Rank</th>
                    <th style={{ padding: '12px 10px' }}>Team Name</th>
                    <th style={{ padding: '12px 10px' }}>Starting Purse</th>
                    <th style={{ padding: '12px 10px' }}>Remaining Purse</th>
                    <th style={{ padding: '12px 10px' }}>Places Owned</th>
                    <th style={{ padding: '12px 10px' }}>Total Spent</th>
                    <th style={{ padding: '12px 10px' }}>Original Value</th>
                    <th style={{ padding: '12px 10px', color: '#ffd166' }}>Current Team Value</th>
                    <th style={{ padding: '12px 10px' }}>Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((t) => (
                    <tr key={t.teamId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <td style={{ padding: '14px 10px', fontWeight: 800 }}>
                        #{t.rank} {t.isTied && '(Tie)'}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: t.color
                          }} />
                          <span style={{ color: '#ffffff', fontWeight: 700 }}>{t.teamName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>
                        {t.startingPurse.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#34d399', fontWeight: 800 }}>
                        {t.remainingPurse.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#ffffff' }}>
                        {t.placesPurchasedCount}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#f87171' }}>
                        {t.totalPurchasedCost.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#93c5fd' }}>
                        {t.totalOriginalValue.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#ffd166', fontWeight: 900, fontSize: '1.05rem' }}>
                        {t.totalCurrentValue.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '14px 10px',
                        color: t.auctionGain >= 0 ? '#34d399' : '#f87171',
                        fontWeight: 800
                      }}>
                        {t.auctionGain >= 0 ? '+' : ''}{t.auctionGain.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL: MARK PLACE AS PURCHASED BY TEAM --- */}
      {sellingPlace && (
        <div className="modal-overlay" onClick={() => setSellingPlace(null)}>
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '32px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(160deg, #121c3b 0%, #0a1128 100%)',
              border: '2px solid rgba(52, 211, 153, 0.5)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSellingPlace(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <XCircle size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div className="hanko-stamp" style={{ borderColor: '#34d399', color: '#34d399' }}>購入記録</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#ffffff' }}>
                Record Landmark Purchase
              </h3>
            </div>

            {/* Selected Landmark Highlight */}
            <div style={{
              display: 'flex',
              gap: '14px',
              background: 'rgba(10, 17, 40, 0.6)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              alignItems: 'center'
            }}>
              <img
                src={sellingPlace.imageUrl}
                alt={sellingPlace.name}
                style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
              <div>
                <h4 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>
                  {sellingPlace.name}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--sakura-light)', marginTop: '2px' }}>
                  Base: ¥{Number(sellingPlace.basePrize).toLocaleString()} • Ref Value: ¥{Number(sellingPlace.originalValue).toLocaleString()}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Select Team */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Purchased by Which Team?
                </label>
                <select
                  className="jp-input"
                  value={buyerTeamId}
                  onChange={(e) => setBuyerTeamId(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">-- Choose Purchasing Team --</option>
                  {state.teams.map((t) => {
                    const stats = leaderboard.find(l => l.teamId === t.id);
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} (Remaining: ¥{stats?.remainingPurse.toLocaleString()})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Enter Purchased Price */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Final Purchased Price (¥ Yen)
                </label>
                <input
                  type="number"
                  className="jp-input"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  min="1"
                  required
                />
              </div>

              {/* Team Purse Check */}
              {selectedBuyerTeam && (
                <div style={{
                  fontSize: '0.85rem',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399'
                }}>
                  Selected: <strong>{selectedBuyerTeam.name}</strong> • Current Remaining Purse: ¥{leaderboard.find(l => l.teamId === selectedBuyerTeam.id)?.remainingPurse.toLocaleString()}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setSellingPlace(null)}
                  className="btn-navy"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  className="btn-sakura"
                  style={{ flex: 2, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm Purchase</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIG / NEW TOURNAMENT --- */}
      {isConfigModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConfigModalOpen(false)}>
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(160deg, #121c3b 0%, #0a1128 100%)',
              border: '2px solid rgba(255, 117, 143, 0.35)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setIsConfigModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <XCircle size={22} />
            </button>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#ffffff', marginBottom: '6px' }}>
              Tournament Configuration
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Set starting purses, number of teams, or restart the auction game.
            </p>

            <form onSubmit={handleApplyConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Auctioneer Name
                </label>
                <input
                  type="text"
                  className="jp-input"
                  value={configAuctioneerName}
                  onChange={(e) => setConfigAuctioneerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Number of Teams ({configNumTeams} Teams)
                </label>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={configNumTeams}
                  onChange={(e) => setConfigNumTeams(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--sakura-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>2</span>
                  <span>4</span>
                  <span>6</span>
                  <span>8</span>
                  <span>10</span>
                  <span>12 Teams</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Starting Purse Per Team (¥ Yen)
                </label>
                <input
                  type="number"
                  className="jp-input"
                  value={configPurse}
                  onChange={(e) => setConfigPurse(e.target.value)}
                  step="1000000"
                  min="1000000"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsConfigModalOpen(false)} className="btn-navy" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-sakura" style={{ flex: 2 }}>
                  Apply & Reset Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Place Modal (Add / Edit Landmark) */}
      <PlaceModal
        isOpen={isPlaceModalOpen}
        onClose={() => { setIsPlaceModalOpen(false); setEditingPlace(null); }}
        onSave={handleSavePlace}
        initialData={editingPlace}
      />

      {/* Winner Podium Celebration Modal */}
      <WinnerModal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        leaderboard={leaderboard}
      />

      {/* Footer */}
      <footer style={{
        padding: '24px 20px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <span>Japan Places Auction Arena 🇯🇵</span>
          <span>•</span>
          <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--sakura-light)' }}>日本の名所オークション 主催者専用</span>
        </div>
        <p>Master Auctioneer Command Center for Conducting Team Property Tournaments across Japan.</p>
      </footer>
    </div>
  );
}
