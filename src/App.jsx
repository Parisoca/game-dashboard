import { useState, useEffect } from 'react';

// --- CONFIGURATION ---
const API_URL = '/api';
// ZeroTier IP for direct connection display
const ZEROTIER_IP = "10.243.82.252";

// Game Definitions
const GAMES = [
  { id: 'satisfactory', name: 'Satisfactory', port: 7777, icon: '🏭', color: '#FA9549' },
  { id: 'minecraft', name: 'Minecraft', port: 25565, icon: '⛏️', color: '#4ADE80' },
  { id: 'rust', name: 'Rust', port: 28015, icon: '☢️', color: '#CD4631' },
  { id: 'conan', name: 'Conan Exiles', port: 7777, icon: '⚔️', color: '#E1CE7A' }
];

// --- NAVITEM COMPONENT ---
const NavItem = ({ game, isActive, onClick }) => {
  const dynamicStyles = {
    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderLeft: isActive ? `4px solid ${game.color}` : '4px solid transparent',
    color: isActive ? 'white' : '#888',
    fontWeight: isActive ? '600' : '400',
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.95rem',
        transition: 'all 0.2s',
        borderRadius: '0 8px 8px 0',
        marginBottom: '4px',
        ...dynamicStyles
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>
        {game.icon}
      </span>
      <span style={{ fontWeight: dynamicStyles.fontWeight }}>
        {game.name}
      </span>
    </button>
  );
};


export default function App() {
  const [activeGameId, setActiveGameId] = useState('satisfactory');
  const [status, setStatus] = useState('UNKNOWN');
  // NEW STATE: Tracks if the map load is complete
  const [isJoinable, setIsJoinable] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(Date.now());

  const activeGame = GAMES.find(g => g.id === activeGameId);

  // Poll status
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [activeGameId]);

  const checkStatus = async () => {
    try {
      // 1. Check if the process is running (ONLINE/OFFLINE)
      const resStatus = await fetch(`${API_URL}/server/status?server=${activeGameId}`);
      const dataStatus = await resStatus.json();
      
      // 2. Check if the server is fully loaded (JOINABLE/LOADING)
      const resJoinable = await fetch(`${API_URL}/server/joinable?server=${activeGameId}`);
      const dataJoinable = await resJoinable.json();
      
      // Update process status (ONLINE/OFFLINE)
      if (dataStatus.status) {
        setStatus(dataStatus.status);
      } else {
        setStatus('OFFLINE');
      }

      // Update joinable status
      setIsJoinable(dataJoinable.joinable || false);
      setLastChecked(Date.now());
    } catch (err) {
      console.error("Failed to fetch status", err);
      setStatus('UNKNOWN');
      setIsJoinable(false);
    }
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/server/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server: activeGameId })
      });
      // Wait 2s for backend to process, then re-check status
      setTimeout(checkStatus, 2000);
    } catch (err) {
      // Use console.error instead of alert()
      console.error(`Failed to ${action} server`, err);
    }
    setLoading(false);
  };

  const handleGameChange = (gameId) => {
      setActiveGameId(gameId);
      setStatus('UNKNOWN');
      setIsJoinable(false);
  };


  // --- SUB-COMPONENTS FOR MAIN DASHBOARD ---
  const StatusCard = () => {
    const isOnline = status === 'ONLINE' || status === 'STARTED';
    const isReady = isOnline && isJoinable;
    const isBusy = loading;
    
    // Logic for the displayed status text
    let statusText = 'Offline';
    if (isBusy) {
        statusText = '...';
    } else if (isReady) {
        statusText = 'Joinable';
    } else if (isOnline && !isJoinable) {
        statusText = 'Loading Map';
    } else if (status === 'UNKNOWN') {
        statusText = 'Unknown';
    }
    
    // Logic for background color
    let bgColor = '#3f3f46'; // Default Offline/Unknown
    if (isReady) {
        bgColor = activeGame.color; // Game Color for Joinable (Green/Red/Orange/etc.)
    } else if (isOnline && !isJoinable) {
        bgColor = '#d97706'; // Orange for Loading
    } 

    return (
      <div style={{ gridArea: 'status', background: bgColor, borderRadius: '16px', padding: '24px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', position: 'relative', overflow: 'hidden', minHeight: '200px' }}>
        <div>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Server Status</p>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '2.5rem' }}>
            {statusText}
          </h2>
        </div>
        <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
          IP: {ZEROTIER_IP} <span style={{ opacity: 0.6, margin: '0 8px' }}>|</span> Port: {activeGame.port}
        </div>
      </div>
    );
  };

  const CircleStat = ({ label, value, color }) => (
    <div style={{ background: '#27272a', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)' }}>
      <div>
        <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>{label}</p>
        <h3 style={{ margin: '5px 0 0 0', color: 'white', fontSize: '1.5rem' }}>{value}</h3>
      </div>
      <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: `4px solid #3f3f46`, borderTop: `4px solid ${color}`, transform: 'rotate(-45deg)' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#18181b', color: 'white', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      
      {/* --- SIDEBAR --- */}
      <div style={{
        width: '240px',
        background: '#27272a',
        paddingTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #3f3f46'
      }}>
        {/* Header with Logo */}
        <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid #3f3f46', marginBottom: '10px', textAlign: 'center' }}>
            <img 
                src="/logodark.png" 
                alt="ParisiHub Logo" 
                style={{ maxWidth: '100%', height: 'auto', maxHeight: '130px' }} 
            />
        </div>

        {/* Navigation Items Loop */}
        {GAMES.map(game => (
          <NavItem 
            key={game.id} 
            game={game}
            isActive={activeGameId === game.id}
            onClick={() => handleGameChange(game.id)}
          />
        ))}
      </div>

      {/* --- MAIN CONTENT --- */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
             <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
              {activeGame.name}
              {/* Status Badge: Uses JOINABLE status for color/text */}
              <span style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px', background: (isJoinable) ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: (isJoinable) ? '#4ade80' : '#ef4444', border: `1px solid ${(isJoinable) ? '#4ade80' : '#ef4444'}` }}>
                {isJoinable ? 'JOINABLE' : status}
              </span>
             </h2>
          </div>
          <div style={{ color: '#71717a', fontSize: '0.9rem' }}>Last check: {new Date(lastChecked).toLocaleTimeString()}</div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ gridColumn: 'span 2' }}><StatusCard /></div>
          <CircleStat label="Active Players" value={(isJoinable) ? "0" : "-"} color={activeGame.color} />
          <CircleStat label="Memory Usage" value="-" color="#8b5cf6" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div style={{ background: '#27272a', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}>Server Controls</h3>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              {/* START Button: Disable if loading, already started OR already joinable */}
              <button 
                onClick={() => handleAction('start')} 
                disabled={loading || isJoinable || status === 'STARTED'} 
                style={{ 
                  flex: 1, padding: '15px', borderRadius: '8px', border: 'none', 
                  background: (isJoinable || status === 'STARTED') ? '#3f3f46' : '#10b981', 
                  color: 'white', 
                  cursor: (isJoinable || status === 'STARTED') ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', fontSize: '1rem', opacity: loading ? 0.7 : 1 
                }}>
                START
              </button>
              
              {/* STOP Button: Disable if loading or fully offline/unknown */}
              <button 
                onClick={() => handleAction('stop')} 
                disabled={loading || status === 'OFFLINE' || status === 'UNKNOWN'} 
                style={{ 
                  flex: 1, padding: '15px', borderRadius: '8px', border: 'none', 
                  background: (status === 'OFFLINE' || status === 'UNKNOWN') ? '#3f3f46' : '#ef4444', 
                  color: 'white', 
                  cursor: (status === 'OFFLINE' || status === 'UNKNOWN') ? 'not-allowed' : 'pointer', 
                  fontWeight: 'bold', fontSize: '1rem', opacity: loading ? 0.7 : 1 
                }}>
                STOP
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '15px' }}>* Server takes approx 120s+ to load the map. Do not click twice.</p>
          </div>
          <div style={{ background: '#27272a', padding: '24px', borderRadius: '16px' }}>
             <h3 style={{ marginTop: 0 }}>Resources</h3>
             {/* Display mock resources if status is STARTED or JOINABLE */}
             <div style={{ marginBottom: '15px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}><span>CPU</span><span>{(isJoinable || status === 'STARTED') ? '12%' : '0%'}</span></div>
               <div style={{ height: '8px', background: '#3f3f46', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: (isJoinable || status === 'STARTED') ? '12%' : '0%', height: '100%', background: '#3b82f6' }}></div></div>
             </div>
             <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}><span>RAM</span><span>{(isJoinable || status === 'STARTED') ? '1.6 GB' : '0 GB'}</span></div>
               <div style={{ height: '8px', background: '#3f3f46', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: (isJoinable || status === 'STARTED') ? '25%' : '0%', height: '100%', background: '#8b5cf6' }}></div></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}