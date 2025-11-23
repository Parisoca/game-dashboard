import { useState, useEffect } from 'react';

// --- CONFIGURATION ---
const API_URL = '/api';
const ZEROTIER_IP = "10.243.82.252";

// Game Definitions (Expand this list as you add more servers)
const GAMES = [
  { id: 'satisfactory', name: 'Satisfactory', port: 7777, icon: '🏭', color: '#FA9549' },
  { id: 'minecraft', name: 'Minecraft', port: 25565, icon: 'cubes', color: '#4ADE80' },
  { id: 'rust', name: 'Rust', port: 28015, icon: 'axe', color: '#CD4631' },
  { id: 'conan', name: 'Conan Exiles', port: 7777, icon: 'skull', color: '#E1CE7A' }
];

export default function App() {
  const [activeGameId, setActiveGameId] = useState('satisfactory');
  const [status, setStatus] = useState('UNKNOWN');
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(Date.now());

  // Get current game object
  const activeGame = GAMES.find(g => g.id === activeGameId);

  // Poll status
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [activeGameId]); // Re-run when game changes

  const checkStatus = async () => {
    try {
      // Note: In the future, you might want to pass ?server=gameId to this endpoint
      const res = await fetch(`${API_URL}/server/status`);
      const data = await res.json();
      
      // Simple logic: If we are looking at Satisfactory, use real data.
      // For others, we default to OFFLINE until you add backend support.
      if (activeGameId === 'satisfactory' && data.servers && data.servers.length > 0) {
        setStatus(data.servers[0].status);
      } else {
        setStatus('OFFLINE');
      }
      setLastChecked(Date.now());
    } catch (err) {
      console.error("Failed to fetch status", err);
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
      setTimeout(checkStatus, 2000);
    } catch (err) {
      alert(`Failed to ${action} server`);
    }
    setLoading(false);
  };

  // --- UI COMPONENTS ---

  // 1. The Sidebar Item
  const NavItem = ({ game }) => (
    <button
      onClick={() => { setActiveGameId(game.id); setStatus('UNKNOWN'); }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '12px 16px',
        background: activeGameId === game.id ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: 'none',
        borderLeft: activeGameId === game.id ? `4px solid ${game.color}` : '4px solid transparent',
        color: activeGameId === game.id ? 'white' : '#888',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '0.95rem',
        transition: 'all 0.2s',
        borderRadius: '0 8px 8px 0',
        marginBottom: '4px'
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>
        {game.id === 'minecraft' ? '⛏️' : game.id === 'rust' ? '☢️' : game.id === 'conan' ? '⚔️' : '🏭'}
      </span>
      <span style={{ fontWeight: activeGameId === game.id ? '600' : '400' }}>{game.name}</span>
    </button>
  );

  // 2. The Status Badge (Big Colored Card)
  const StatusCard = () => {
    const isOnline = status === 'ONLINE' || status === 'STARTED';
    const isBusy = loading;
    const bgColor = isOnline ? activeGame.color : (status === 'UNKNOWN' ? '#d97706' : '#3f3f46');
    
    return (
      <div style={{
        gridArea: 'status',
        background: bgColor,
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Server Status</p>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '2.5rem' }}>
            {isBusy ? '...' : (isOnline ? 'Online' : 'Offline')}
          </h2>
        </div>
        
        <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
          IP: {ZEROTIER_IP}
          <span style={{ opacity: 0.6, margin: '0 8px' }}>|</span>
          Port: {activeGame.port}
        </div>
      </div>
    );
  };

  // 3. Circular Stat Placeholder (Visual only for now)
  const CircleStat = ({ label, value, color }) => (
    <div style={{
      background: '#27272a',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
    }}>
      <div>
        <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>{label}</p>
        <h3 style={{ margin: '5px 0 0 0', color: 'white', fontSize: '1.5rem' }}>{value}</h3>
      </div>
      {/* CSS Ring Mockup */}
      <div style={{
        width: '50px', height: '50px',
        borderRadius: '50%',
        border: `4px solid #3f3f46`,
        borderTop: `4px solid ${color}`,
        transform: 'rotate(-45deg)'
      }} />
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#18181b', 
      color: 'white', 
      display: 'flex',
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* --- SIDEBAR --- */}
      <div style={{
        width: '240px',
        background: '#27272a',
        paddingTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #3f3f46'
      }}>
        <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid #3f3f46', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#2563eb', width: '12px', height: '12px', borderRadius: '50%', display: 'block' }}></span>
            ParisiHub
          </h1>
        </div>
        {GAMES.map(game => <NavItem key={game.id} game={game} />)}
      </div>

      {/* --- MAIN CONTENT --- */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* Header */}
        <header style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
             <h2 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
              {activeGame.name}
              <span style={{ 
                fontSize: '0.8rem', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                background: status === 'ONLINE' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                color: status === 'ONLINE' ? '#4ade80' : '#ef4444',
                border: `1px solid ${status === 'ONLINE' ? '#4ade80' : '#ef4444'}`
              }}>
                {status}
              </span>
             </h2>
          </div>
          <div style={{ color: '#71717a', fontSize: '0.9rem' }}>
            Last check: {new Date(lastChecked).toLocaleTimeString()}
          </div>
        </header>

        {/* Dashboard Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Big Status Card (Spans 2 columns if wide enough) */}
          <div style={{ gridColumn: 'span 2' }}>
            <StatusCard />
          </div>

          {/* Smaller Stats */}
          <CircleStat label="Active Players" value={status === 'ONLINE' ? "0" : "-"} color={activeGame.color} />
          <CircleStat label="Memory Usage" value="-" color="#8b5cf6" />
        </div>

        {/* Resource Bars & Controls Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          
          {/* Left: Controls */}
          <div style={{ background: '#27272a', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0 }}>Server Controls</h3>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button 
                onClick={() => handleAction('start')}
                disabled={loading || status === 'ONLINE' || status === 'STARTED'}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (status === 'ONLINE' || status === 'STARTED') ? '#3f3f46' : '#10b981',
                  color: 'white',
                  cursor: (status === 'ONLINE' || status === 'STARTED') ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  opacity: loading ? 0.7 : 1
                }}
              >
                START
              </button>

              <button 
                 onClick={() => handleAction('stop')}
                 disabled={loading || status === 'STOPPED' || status === 'OFFLINE'}
                style={{
                  flex: 1,
                  padding: '15px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (status === 'STOPPED' || status === 'OFFLINE') ? '#3f3f46' : '#ef4444',
                  color: 'white',
                  cursor: (status === 'STOPPED' || status === 'OFFLINE') ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  opacity: loading ? 0.7 : 1
                }}
              >
                STOP
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '15px' }}>
              * Server takes approx 60s to start. Do not click twice.
            </p>
          </div>

          {/* Right: Mock Resources */}
          <div style={{ background: '#27272a', padding: '24px', borderRadius: '16px' }}>
             <h3 style={{ marginTop: 0 }}>Resources</h3>
             
             <div style={{ marginBottom: '15px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                 <span>CPU</span>
                 <span>{status === 'ONLINE' ? '12%' : '0%'}</span>
               </div>
               <div style={{ height: '8px', background: '#3f3f46', borderRadius: '4px', overflow: 'hidden' }}>
                 <div style={{ width: status === 'ONLINE' ? '12%' : '0%', height: '100%', background: '#3b82f6' }}></div>
               </div>
             </div>

             <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                 <span>RAM</span>
                 <span>{status === 'ONLINE' ? '1.6 GB' : '0 GB'}</span>
               </div>
               <div style={{ height: '8px', background: '#3f3f46', borderRadius: '4px', overflow: 'hidden' }}>
                 <div style={{ width: status === 'ONLINE' ? '25%' : '0%', height: '100%', background: '#8b5cf6' }}></div>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}