import React, { useState } from 'react';
import {
  Gavel,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Users,
  MapPin,
  TrendingUp,
  AlertCircle,
  Edit2,
  Trash2,
  Copy,
  Check,
  Coins,
  Shield,
  Sparkles
} from 'lucide-react';
import { auctioneerAction } from '../services/api';
import PlaceModal from './PlaceModal';
import WinnerModal from './WinnerModal';

export default function AuctioneerDashboard({
  gameId,
  auctioneerSecret,
  gameState,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('stage'); // 'stage', 'places', 'teams'
  const [placeFilter, setPlaceFilter] = useState('ALL'); // 'ALL', 'UPCOMING', 'LIVE', 'SOLD', 'UNSOLD'
  
  // Modal states
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Live Auction Controls state
  const [bidAmount, setBidAmount] = useState('');
  const [selectedBuyerTeamId, setSelectedBuyerTeamId] = useState('');
  const [soldPrice, setSoldPrice] = useState('');
  const [actionError, setActionError] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const { game, currentPlace, places = [], teams = [] } = gameState || {};

  // Find currently selected buyer team
  const selectedBuyerTeam = teams.find(t => t.teamId === selectedBuyerTeamId);

  // Helper to copy room code
  const handleCopyCode = () => {
    if (!game?.roomCode) return;
    navigator.clipboard.writeText(game.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Start auction on a specific place
  const handleStartPlace = async (placeId) => {
    setActionError('');
    try {
      await auctioneerAction(`places/${placeId}/start`, 'POST', gameId, auctioneerSecret);
      setActiveTab('stage');
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Update current bid
  const handleUpdateBid = async (newAmount) => {
    if (!currentPlace) return;
    setActionError('');
    try {
      const amount = Number(newAmount);
      await auctioneerAction(`places/${currentPlace.id}/bid`, 'POST', gameId, auctioneerSecret, {
        bidAmount: amount
      });
      setBidAmount('');
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Quick increment current bid
  const handleQuickIncrement = (delta) => {
    if (!currentPlace) return;
    const base = Number(currentPlace.currentBid || currentPlace.basePrize);
    handleUpdateBid(base + delta);
  };

  // Confirm Sold to Team
  const handleConfirmSold = async () => {
    if (!currentPlace) return;
    if (!selectedBuyerTeamId) {
      setActionError('Please select a purchasing team.');
      return;
    }
    const finalPrice = Number(soldPrice || currentPlace.currentBid || currentPlace.basePrize);
    if (!finalPrice || finalPrice <= 0) {
      setActionError('Please enter a valid purchase price.');
      return;
    }

    // Client-side quick check (server also enforces this strictly)
    if (selectedBuyerTeam && finalPrice > selectedBuyerTeam.remainingPurse) {
      setActionError(`Cannot confirm: ${selectedBuyerTeam.teamName} only has ${selectedBuyerTeam.remainingPurse.toLocaleString()} pts remaining.`);
      return;
    }

    setActionError('');
    try {
      await auctioneerAction(`places/${currentPlace.id}/sell`, 'POST', gameId, auctioneerSecret, {
        teamId: selectedBuyerTeamId,
        purchasedPrice: finalPrice
      });
      setSelectedBuyerTeamId('');
      setSoldPrice('');
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Mark place unsold
  const handleMarkUnsold = async () => {
    if (!currentPlace) return;
    setActionError('');
    try {
      await auctioneerAction(`places/${currentPlace.id}/unsold`, 'POST', gameId, auctioneerSecret);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Reopen auction result
  const handleReopen = async (placeId) => {
    setActionError('');
    try {
      await auctioneerAction(`places/${placeId}/reopen`, 'POST', gameId, auctioneerSecret);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Relist place
  const handleRelist = async (placeId) => {
    setActionError('');
    try {
      await auctioneerAction(`places/${placeId}/relist`, 'POST', gameId, auctioneerSecret);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Save place (Create or Edit)
  const handleSavePlace = async (placeData) => {
    setActionError('');
    try {
      if (editingPlace) {
        await auctioneerAction(`places/${editingPlace.id}`, 'PUT', gameId, auctioneerSecret, placeData);
      } else {
        await auctioneerAction('places/add', 'POST', gameId, auctioneerSecret, placeData);
      }
      setIsPlaceModalOpen(false);
      setEditingPlace(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Delete place
  const handleDeletePlace = async (placeId) => {
    if (!window.confirm('Are you sure you want to delete this place?')) return;
    setActionError('');
    try {
      await auctioneerAction(`places/${placeId}`, 'DELETE', gameId, auctioneerSecret);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // End Auction
  const handleEndAuction = async () => {
    if (!window.confirm('Are you sure you want to end this auction and calculate final winners?')) return;
    setActionError('');
    try {
      await auctioneerAction('end', 'POST', gameId, auctioneerSecret);
      setIsWinnerModalOpen(true);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Filtered places
  const filteredPlaces = places.filter(p => {
    if (placeFilter === 'ALL') return true;
    return p.status === placeFilter;
  });

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
      {/* Top Prominent Room OTP & Controls Banner (Section 2) */}
      <div className="glass-panel" style={{
        padding: '24px 30px',
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        background: 'linear-gradient(135deg, rgba(26, 38, 77, 0.9) 0%, rgba(10, 17, 40, 0.95) 100%)',
        border: '1px solid rgba(255, 117, 143, 0.3)'
      }}>
        {/* Left: Room OTP Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--sakura-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Join Code for Teams
              </span>
              <span className="hanko-stamp" style={{ fontSize: '0.7rem' }}>部屋番号</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '2.6rem',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '0.18em',
                textShadow: '0 0 20px rgba(255, 117, 143, 0.4)'
              }}>
                {game?.roomCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="btn-navy"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                {copiedCode ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          <div style={{
            height: '48px',
            width: '1px',
            background: 'rgba(255, 255, 255, 0.12)',
            display: 'none',
            md: 'block'
          }} />

          {/* Game Stats */}
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Game Status</span>
              <div style={{ marginTop: '4px' }}>
                <span className={`badge-status badge-${(game?.status || 'waiting').toLowerCase()}`}>
                  {game?.status}
                </span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Teams</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                {teams.length} Teams
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Starting Purse</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-accent)', marginTop: '2px' }}>
                {Number(game?.startingPurse || 0).toLocaleString()} pts
              </div>
            </div>
          </div>
        </div>

        {/* Right: Master Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setEditingPlace(null); setIsPlaceModalOpen(true); }}
            className="btn-navy"
            style={{ border: '1px solid rgba(255, 117, 143, 0.35)' }}
          >
            <Plus size={16} color="var(--sakura-primary)" />
            <span>Add Japan Place</span>
          </button>

          <button
            onClick={handleEndAuction}
            className="btn-gold"
          >
            <Trophy size={18} />
            <span>End & Crown Winner</span>
          </button>
        </div>
      </div>

      {/* Action Error banner if any */}
      {actionError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          fontSize: '0.9rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px'
      }}>
        <button
          onClick={() => setActiveTab('stage')}
          style={{
            background: activeTab === 'stage' ? 'var(--sakura-primary)' : 'transparent',
            color: activeTab === 'stage' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Gavel size={16} />
          <span>Live Stage {currentPlace && '🔴 (Active)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('places')}
          style={{
            background: activeTab === 'places' ? 'var(--sakura-primary)' : 'transparent',
            color: activeTab === 'places' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <MapPin size={16} />
          <span>Japan Places ({places.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          style={{
            background: activeTab === 'teams' ? 'var(--sakura-primary)' : 'transparent',
            color: activeTab === 'teams' ? '#ffffff' : 'var(--text-secondary)',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <Users size={16} />
          <span>Teams Valuation & Rankings ({teams.length})</span>
        </button>
      </div>

      {/* --- TAB 1: LIVE AUCTION STAGE --- */}
      {activeTab === 'stage' && (
        <div>
          {currentPlace ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '24px'
            }}>
              {/* Left Column: Place Showcase Card */}
              <div className="glass-panel-glow" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
                <div style={{ height: '320px', position: 'relative' }}>
                  <img
                    src={currentPlace.imageUrl}
                    alt={currentPlace.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span className="badge-status badge-live">
                      ● LIVE AUCTION
                    </span>
                    <span className="hanko-stamp" style={{ background: 'rgba(0,0,0,0.6)', borderColor: '#ffd166', color: '#ffd166' }}>
                      現在入札中
                    </span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(7, 13, 30, 0.95) 0%, transparent 100%)',
                    padding: '24px 20px 16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--sakura-light)', fontSize: '0.85rem' }}>
                      <MapPin size={14} />
                      <span>{currentPlace.location}</span>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                      {currentPlace.name}
                    </h2>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '20px' }}>
                    {currentPlace.description || 'Iconic Japanese heritage destination.'}
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    background: 'rgba(10, 17, 40, 0.6)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Base Starting Prize
                      </span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                        {Number(currentPlace.basePrize).toLocaleString()} pts
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Original Reference Value
                      </span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#93c5fd', marginTop: '4px' }}>
                        {Number(currentPlace.originalValue).toLocaleString()} pts
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Auctioneer Live Controls */}
              <div className="glass-panel" style={{ padding: '28px', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Gavel size={20} color="var(--sakura-primary)" />
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#ffffff' }}>
                      Bidding Controls
                    </h3>
                  </div>
                  <span className="hanko-stamp">競売管理</span>
                </div>

                {/* Current Bid Display */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 117, 143, 0.15) 0%, rgba(10, 17, 40, 0.8) 100%)',
                  border: '1px solid rgba(255, 117, 143, 0.35)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--sakura-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Current Bid on Floor
                  </span>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '3rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    marginTop: '4px',
                    textShadow: '0 0 25px rgba(255, 117, 143, 0.5)'
                  }}>
                    {Number(currentPlace.currentBid || currentPlace.basePrize).toLocaleString()} <span style={{ fontSize: '1.2rem', color: 'var(--sakura-light)' }}>pts</span>
                  </div>
                </div>

                {/* Quick Bid Increment Buttons */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Quick Bid Increments
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[1000, 2000, 5000, 10000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => handleQuickIncrement(inc)}
                        className="btn-navy"
                        style={{ padding: '10px 4px', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        +{inc >= 1000 ? `${inc / 1000}k` : inc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Set Custom Bid Input */}
                <div style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Or Set Exact Floor Bid
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="number"
                      className="jp-input"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`Min: ${currentPlace.basePrize}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateBid(bidAmount)}
                      disabled={!bidAmount}
                      className="btn-sakura"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      Update Bid
                    </button>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', marginBottom: '24px' }} />

                {/* Finalize Sale Section */}
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="#34d399" />
                    <span>Confirm Sale & Record Purchase</span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Winning Team
                      </label>
                      <select
                        className="jp-input"
                        value={selectedBuyerTeamId}
                        onChange={(e) => setSelectedBuyerTeamId(e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">-- Choose Purchasing Team --</option>
                        {teams.map((t) => (
                          <option key={t.teamId} value={t.teamId}>
                            {t.teamName} (Purse: {t.remainingPurse.toLocaleString()} pts)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Purchased Price (Points)
                      </label>
                      <input
                        type="number"
                        className="jp-input"
                        value={soldPrice || currentPlace.currentBid || currentPlace.basePrize}
                        onChange={(e) => setSoldPrice(e.target.value)}
                      />
                    </div>

                    {/* Buyer purse check warning */}
                    {selectedBuyerTeam && (
                      <div style={{
                        fontSize: '0.82rem',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: (Number(soldPrice || currentPlace.currentBid) > selectedBuyerTeam.remainingPurse)
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(16, 185, 129, 0.15)',
                        color: (Number(soldPrice || currentPlace.currentBid) > selectedBuyerTeam.remainingPurse)
                          ? '#f87171'
                          : '#34d399'
                      }}>
                        {selectedBuyerTeam.teamName} Remaining Purse: {selectedBuyerTeam.remainingPurse.toLocaleString()} pts
                        {Number(soldPrice || currentPlace.currentBid) > selectedBuyerTeam.remainingPurse && ' (INSUFFICIENT FUNDS)'}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={handleConfirmSold}
                        disabled={!selectedBuyerTeamId}
                        className="btn-sakura"
                        style={{ flex: 2, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Sold to Team!</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleMarkUnsold}
                        className="btn-navy"
                        style={{ flex: 1, color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        <XCircle size={16} />
                        <span>Unsold</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State: Ready for next place */
            <div className="glass-panel" style={{
              padding: '60px 20px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(255, 117, 143, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                color: 'var(--sakura-primary)'
              }}>
                <Gavel size={34} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#ffffff', marginBottom: '8px' }}>
                No Destination Currently on the Auction Floor
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
                Select an upcoming Japanese landmark from the catalog to commence live bidding.
              </p>
              <button
                onClick={() => setActiveTab('places')}
                className="btn-sakura"
              >
                <span>Browse & Start Next Place</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: JAPAN PLACES CATALOG & MANAGEMENT --- */}
      {activeTab === 'places' && (
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['ALL', 'LIVE', 'UPCOMING', 'SOLD', 'UNSOLD'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPlaceFilter(filter)}
                  style={{
                    background: placeFilter === filter ? 'rgba(255, 117, 143, 0.2)' : 'rgba(10, 17, 40, 0.5)',
                    border: placeFilter === filter ? '1px solid var(--sakura-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: placeFilter === filter ? 'var(--sakura-light)' : 'var(--text-secondary)',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setEditingPlace(null); setIsPlaceModalOpen(true); }}
              className="btn-sakura"
              style={{ padding: '8px 18px', fontSize: '0.88rem' }}
            >
              <Plus size={16} />
              <span>Add Destination</span>
            </button>
          </div>

          {/* Places Grid */}
          <div className="places-grid">
            {filteredPlaces.map((place) => {
              const buyerTeam = teams.find(t => t.teamId === place.purchasedByTeamId);
              return (
                <div
                  key={place.id}
                  className="glass-panel"
                  style={{
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: place.status === 'LIVE' ? '2px solid var(--sakura-primary)' : '1px solid var(--navy-border)'
                  }}
                >
                  {/* Photo Thumbnail */}
                  <div style={{ height: '180px', position: 'relative' }}>
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      <span className={`badge-status badge-${place.status.toLowerCase()}`}>
                        {place.status}
                      </span>
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(7, 13, 30, 0.9) 0%, transparent 100%)',
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sakura-light)', fontSize: '0.75rem' }}>
                        <MapPin size={12} />
                        <span>{place.location}</span>
                      </div>
                      <h4 style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.05rem', margin: '2px 0 0' }}>
                        {place.name}
                      </h4>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      {/* Price Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        background: 'rgba(10, 17, 40, 0.5)',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Base Prize</span>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                            {Number(place.basePrize).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Original Value</span>
                          <div style={{ fontWeight: 700, color: '#93c5fd', fontSize: '0.95rem' }}>
                            {Number(place.originalValue).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Sold Banner */}
                      {place.status === 'SOLD' && (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '12px',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ color: '#34d399', fontWeight: 700 }}>
                            Sold to {buyerTeam?.teamName || 'Team'}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            Purchased at {Number(place.purchasedPrice).toLocaleString()} pts
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {place.status !== 'SOLD' && (
                        <button
                          onClick={() => handleStartPlace(place.id)}
                          className="btn-sakura"
                          style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
                        >
                          <Play size={13} />
                          <span>Start Auction</span>
                        </button>
                      )}

                      {place.status === 'SOLD' && (
                        <button
                          onClick={() => handleReopen(place.id)}
                          className="btn-navy"
                          title="Reopen or correct this auction result"
                          style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem', color: '#ffd166' }}
                        >
                          <RotateCcw size={13} />
                          <span>Reopen</span>
                        </button>
                      )}

                      {place.status === 'UNSOLD' && (
                        <button
                          onClick={() => handleRelist(place.id)}
                          className="btn-navy"
                          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                        >
                          <RotateCcw size={13} />
                          <span>Relist</span>
                        </button>
                      )}

                      <button
                        onClick={() => { setEditingPlace(place); setIsPlaceModalOpen(true); }}
                        className="btn-navy"
                        style={{ padding: '8px' }}
                        title="Edit Place"
                      >
                        <Edit2 size={14} />
                      </button>

                      {place.status !== 'SOLD' && (
                        <button
                          onClick={() => handleDeletePlace(place.id)}
                          className="btn-navy"
                          style={{ padding: '8px', color: '#f87171' }}
                          title="Delete Place"
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

      {/* --- TAB 3: TEAMS MASTER FINANCIAL OVERVIEW & AUDIT --- */}
      {activeTab === 'teams' && (
        <div>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#ffffff' }}>
                  Teams Financial & Valuation Master Ledger
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Visible strictly to Auctioneer. Evaluates Total Current Value and Auction Gain in real time.
                </p>
              </div>
              <div className="hanko-stamp">採点台帳</div>
            </div>

            {/* Table */}
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
                    <th style={{ padding: '12px 10px' }}>Places Won</th>
                    <th style={{ padding: '12px 10px' }}>Total Cost</th>
                    <th style={{ padding: '12px 10px' }}>Original Value</th>
                    <th style={{ padding: '12px 10px', color: '#ffd166' }}>Current Team Value</th>
                    <th style={{ padding: '12px 10px' }}>Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
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
                            backgroundColor: t.color || '#ff758f'
                          }} />
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>{t.teamName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>
                        {t.startingPurse.toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 10px', color: '#34d399', fontWeight: 700 }}>
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
                      <td style={{ padding: '14px 10px', color: '#ffd166', fontWeight: 800, fontSize: '1rem' }}>
                        {t.totalCurrentValue.toLocaleString()}
                      </td>
                      <td style={{
                        padding: '14px 10px',
                        color: t.auctionGain >= 0 ? '#34d399' : '#f87171',
                        fontWeight: 700
                      }}>
                        {t.auctionGain >= 0 ? '+' : ''}{t.auctionGain.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Place Modal */}
      <PlaceModal
        isOpen={isPlaceModalOpen}
        onClose={() => { setIsPlaceModalOpen(false); setEditingPlace(null); }}
        onSave={handleSavePlace}
        initialData={editingPlace}
      />

      {/* Winner Modal */}
      <WinnerModal
        isOpen={isWinnerModalOpen}
        onClose={() => setIsWinnerModalOpen(false)}
        leaderboard={teams}
      />
    </div>
  );
}
