import React, { useState } from 'react';
import { Copy, Check, Radio, LogOut, ShieldCheck, Users } from 'lucide-react';

export default function Navbar({ role, roomCode, teamName, teamColor, onExit }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header style={{
      width: '100%',
      padding: '16px 24px',
      background: 'rgba(10, 17, 40, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      {/* Brand Title */}
      <div 
        onClick={onExit}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
      >
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #ff758f 0%, #e63946 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(255, 117, 143, 0.35)'
        }}>
          <img src="/icon.svg" alt="Torii" style={{ width: '28px', height: '28px' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.15rem',
              letterSpacing: '0.04em',
              color: '#ffffff'
            }}>
              JAPAN PLACES
            </span>
            <span style={{
              background: 'linear-gradient(90deg, #ff758f, #ffd166)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              fontSize: '1.15rem'
            }}>
              AUCTION ARENA
            </span>
            <span style={{ fontSize: '1.1rem' }}>🇯🇵</span>
          </div>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--sakura-light)',
            fontFamily: 'var(--font-serif)',
            letterSpacing: '0.12em',
            margin: 0
          }}>
            日本の名所オークションゲーム
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* Live Status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '6px 12px',
          borderRadius: '999px',
          fontSize: '0.78rem',
          fontWeight: 600,
          color: '#34d399'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#34d399',
            boxShadow: '0 0 10px #34d399'
          }} />
          <span>LIVE SYNC</span>
        </div>

        {/* Room Code Badge */}
        {roomCode && (
          <button
            onClick={handleCopyCode}
            title="Click to copy Room Code"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 117, 143, 0.12)',
              border: '1px solid rgba(255, 117, 143, 0.35)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 700,
              transition: 'all 0.2s'
            }}
          >
            <span style={{ color: 'var(--sakura-light)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Room</span>
            <span style={{ fontFamily: 'monospace', letterSpacing: '0.15em', fontSize: '1rem', color: '#ff8fa3' }}>
              {roomCode}
            </span>
            {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} color="#ffb7b2" />}
          </button>
        )}

        {/* Role Pill */}
        {role === 'auctioneer' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(255, 215, 0, 0.1))',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#ffd166'
          }}>
            <ShieldCheck size={16} />
            <span>Auctioneer Master</span>
          </div>
        )}

        {role === 'team' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: `1px solid ${teamColor || '#ff758f'}`,
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#ffffff'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: teamColor || '#ff758f',
              boxShadow: `0 0 8px ${teamColor || '#ff758f'}`
            }} />
            <Users size={15} />
            <span>{teamName || 'Our Team'}</span>
          </div>
        )}

        {/* Exit Button */}
        {role && (
          <button
            onClick={onExit}
            title="Leave / Switch Room"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <LogOut size={14} />
            <span style={{ display: 'none', md: 'inline' }}>Leave</span>
          </button>
        )}
      </div>
    </header>
  );
}
