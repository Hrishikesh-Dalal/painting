'use client';

import { useState, useEffect } from "react";

interface PaletteData {
  id?: string;
  timestamp?: string;
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
  };
  explanation: string;
}

type RoomId = 'living' | 'bedroom' | 'kitchen' | 'bath';
type WallKey = 'north' | 'east' | 'south' | 'west' | 'floor';

interface RoomWallConfig {
  north: string;
  east: string;
  south: string;
  west: string;
  floor: string;
}

const DEFAULT_PALETTE: PaletteData = {
  id: 'default-1',
  timestamp: 'Initial',
  colors: {
    background: '#fef6e4',
    primary: '#000000',
    secondary: '#ff006e',
    accent: '#ccff00'
  },
  explanation: 'Unprocessed concrete base elevated by high-vis accents. Harsh, functional separation between utility and relaxation zones.'
};

export default function Home() {
  const [palette, setPalette] = useState<PaletteData>(DEFAULT_PALETTE);
  const [history, setHistory] = useState<PaletteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // 3D Visualizer States
  const [selectedRoom, setSelectedRoom] = useState<RoomId>('living');
  const [selectedWall, setSelectedWall] = useState<WallKey | null>('north');
  const [rotationY, setRotationY] = useState<number>(-35);
  const [tiltX, setTiltX] = useState<number>(-20);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  // Wall Colors Mapping per Room
  const [roomWalls, setRoomWalls] = useState<Record<RoomId, RoomWallConfig>>({
    living: {
      north: DEFAULT_PALETTE.colors.background,
      east: DEFAULT_PALETTE.colors.accent,
      south: DEFAULT_PALETTE.colors.secondary,
      west: DEFAULT_PALETTE.colors.background,
      floor: DEFAULT_PALETTE.colors.secondary,
    },
    bedroom: {
      north: DEFAULT_PALETTE.colors.secondary,
      east: DEFAULT_PALETTE.colors.background,
      south: DEFAULT_PALETTE.colors.accent,
      west: DEFAULT_PALETTE.colors.secondary,
      floor: DEFAULT_PALETTE.colors.background,
    },
    kitchen: {
      north: DEFAULT_PALETTE.colors.accent,
      east: DEFAULT_PALETTE.colors.secondary,
      south: DEFAULT_PALETTE.colors.background,
      west: DEFAULT_PALETTE.colors.accent,
      floor: DEFAULT_PALETTE.colors.background,
    },
    bath: {
      north: DEFAULT_PALETTE.colors.background,
      east: DEFAULT_PALETTE.colors.accent,
      south: DEFAULT_PALETTE.colors.background,
      west: DEFAULT_PALETTE.colors.secondary,
      floor: DEFAULT_PALETTE.colors.accent,
    },
  });

  // Load saved history & wall config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('brutalist_room_palettes');
    if (saved) {
      try {
        const parsed: PaletteData[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          updatePaletteState(parsed[0]);
        } else {
          setHistory([DEFAULT_PALETTE]);
        }
      } catch (e) {
        console.error('Failed to parse saved palettes:', e);
        setHistory([DEFAULT_PALETTE]);
      }
    } else {
      setHistory([DEFAULT_PALETTE]);
    }
  }, []);

  // Update room wall color map whenever a new palette is applied
  const updatePaletteState = (newPalette: PaletteData) => {
    setPalette(newPalette);
    const { colors } = newPalette;
    setRoomWalls({
      living: { north: colors.background, east: colors.accent, south: colors.secondary, west: colors.background, floor: colors.secondary },
      bedroom: { north: colors.secondary, east: colors.background, south: colors.accent, west: colors.secondary, floor: colors.background },
      kitchen: { north: colors.accent, east: colors.secondary, south: colors.background, west: colors.accent, floor: colors.background },
      bath: { north: colors.background, east: colors.accent, south: colors.background, west: colors.secondary, floor: colors.accent },
    });
  };

  const savePaletteToStorage = (newPalette: PaletteData) => {
    const updatedHistory = [
      newPalette,
      ...history.filter((item) => item.explanation !== newPalette.explanation)
    ].slice(0, 12);

    setHistory(updatedHistory);
    localStorage.setItem('brutalist_room_palettes', JSON.stringify(updatedHistory));
  };

  const fetchPalette = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ollama', { method: 'POST' });
      const data = await res.json();
      
      if (data.colors && data.explanation) {
        const newPaletteData: PaletteData = {
          ...data,
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updatePaletteState(newPaletteData);
        savePaletteToStorage(newPaletteData);
      }
    } catch (e) {
      console.error('Error fetching palette:', e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const clearHistory = () => {
    if (confirm('Clear stored room palette history?')) {
      localStorage.removeItem('brutalist_room_palettes');
      setHistory([DEFAULT_PALETTE]);
      updatePaletteState(DEFAULT_PALETTE);
    }
  };

  // Reassign specific wall color
  const setWallColor = (wall: WallKey, colorHex: string) => {
    setRoomWalls((prev) => ({
      ...prev,
      [selectedRoom]: {
        ...prev[selectedRoom],
        [wall]: colorHex,
      },
    }));
  };

  const { colors, explanation } = palette;
  const currentRoomWalls = roomWalls[selectedRoom];

  return (
    <div 
      className="min-h-screen p-4 md:p-8 font-mono transition-colors duration-300 select-none"
      style={{ backgroundColor: colors.background, color: colors.primary }}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* HEADER */}
        <header 
          className="pb-6 border-b-4 flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ borderColor: colors.primary }}
        >
          <div>
            <div className="inline-block px-2 py-1 mb-2 text-xs font-black uppercase tracking-wider"
                 style={{ backgroundColor: colors.accent, color: colors.primary, border: `2px solid ${colors.primary}` }}>
              BRUTALIST ARCH-LAB v3.0 • 3D INSPECTOR
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter m-0 leading-none">
              Brutalist House
            </h1>
            <p className="text-sm md:text-base opacity-90 font-bold uppercase mt-2">
              3D Spatial Wall Visualizer & Local AI Palette Generator
            </p>
          </div>
          
          <button 
            onClick={fetchPalette} 
            disabled={loading}
            className="px-6 py-4 text-lg font-black uppercase transition-all duration-100 disabled:opacity-60 disabled:cursor-wait shrink-0 cursor-pointer active:translate-x-1 active:translate-y-1"
            style={{
              backgroundColor: colors.accent, 
              color: colors.primary, 
              border: `4px solid ${colors.primary}`, 
              boxShadow: `6px 6px 0 ${colors.primary}`,
            }}
          >
            {loading ? 'Consulting Gemma 4...' : '⚡ Renovate Colors'}
          </button>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: RATIONALE, SWATCHES & WALL COLOR ASSIGNMENT */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* AI Rationale Card */}
            <div 
              className="p-6 transition-all duration-300"
              style={{ 
                backgroundColor: '#ffffff', 
                border: `4px solid ${colors.primary}`, 
                boxShadow: `8px 8px 0 ${colors.primary}` 
              }}
            >
              <h2 className="text-xl font-black uppercase mb-3 tracking-tight flex items-center justify-between">
                <span>AI Rationale</span>
                <span className="text-xs px-2 py-0.5 border-2" style={{ borderColor: colors.primary }}>
                  {palette.timestamp || 'Active'}
                </span>
              </h2>
              <p className="text-sm md:text-base font-semibold leading-relaxed mb-6 italic opacity-90">
                "{explanation}"
              </p>

              {/* Base Color Swatches */}
              <div className="flex flex-col gap-3 pt-4 border-t-4" style={{ borderColor: colors.primary }}>
                <span className="text-xs font-black uppercase tracking-wider opacity-75">Base Palette Swatches</span>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(colors).map(([key, hex]) => (
                    <button
                      key={key}
                      onClick={() => copyToClipboard(hex)}
                      className="flex items-center gap-3 p-2 text-left border-2 transition-transform hover:-translate-y-0.5 cursor-pointer relative"
                      style={{ borderColor: colors.primary, backgroundColor: '#f8f8f8' }}
                    >
                      <div 
                        className="w-8 h-8 shrink-0 border-2"
                        style={{ backgroundColor: hex, borderColor: colors.primary }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-70">{key}</span>
                        <span className="text-xs font-black uppercase truncate">{hex}</span>
                      </div>
                      {copiedHex === hex && (
                        <span className="absolute right-1 top-1 text-[9px] font-black bg-black text-white px-1 uppercase">
                          Copied
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* WALL COLOR ASSIGNMENT CONTROL */}
            <div 
              className="p-5 flex flex-col gap-4"
              style={{ 
                backgroundColor: '#ffffff', 
                border: `4px solid ${colors.primary}`,
                boxShadow: `8px 8px 0 ${colors.primary}`
              }}
            >
              <div className="flex justify-between items-center border-b-2 pb-2" style={{ borderColor: colors.primary }}>
                <h3 className="text-sm font-black uppercase tracking-tight">Wall Color Inspector</h3>
                <span className="text-xs font-bold uppercase px-2 py-0.5 bg-black text-white">
                  Room: {selectedRoom}
                </span>
              </div>

              <p className="text-xs font-bold opacity-80">
                Select a wall, then choose a color from the current palette to apply:
              </p>

              {/* Selected Wall Selector */}
              <div className="grid grid-cols-5 gap-1 text-[11px] font-black uppercase">
                {(['north', 'east', 'south', 'west', 'floor'] as WallKey[]).map((wallKey) => (
                  <button
                    key={wallKey}
                    onClick={() => setSelectedWall(wallKey)}
                    className={`py-2 border-2 transition-all cursor-pointer ${
                      selectedWall === wallKey ? 'bg-black text-white translate-y-0.5' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={{ borderColor: colors.primary }}
                  >
                    {wallKey}
                  </button>
                ))}
              </div>

              {/* Color Assign Buttons for Selected Wall */}
              {selectedWall && (
                <div className="p-3 border-2 flex flex-col gap-2" style={{ borderColor: colors.primary, backgroundColor: '#fcfcfc' }}>
                  <span className="text-xs font-black uppercase">
                    Assigning to: <span className="underline">{selectedWall.toUpperCase()} WALL</span>
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(colors).map(([key, hex]) => (
                      <button
                        key={key}
                        onClick={() => setWallColor(selectedWall, hex)}
                        className={`h-10 border-2 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 ${
                          currentRoomWalls[selectedWall] === hex ? 'ring-4 ring-black' : ''
                        }`}
                        style={{ backgroundColor: hex, borderColor: colors.primary }}
                        title={`${key}: ${hex}`}
                      >
                        <span className="text-[9px] font-black uppercase bg-white/80 px-1 border border-black">
                          {key[0].toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QUICK STATS */}
            <div 
              className="p-4 flex items-center justify-between text-xs font-black uppercase"
              style={{ 
                backgroundColor: colors.secondary, 
                color: colors.background, 
                border: `4px solid ${colors.primary}`,
                boxShadow: `6px 6px 0 ${colors.primary}`
              }}
            >
              <span>Saved Palettes: {history.length}</span>
              <button onClick={clearHistory} className="underline hover:opacity-80 cursor-pointer">
                Clear Storage
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: 3D ROOM ROTATING INSPECTOR & 2D FLOORPLAN */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* VIEW MODE & ROOM SELECTOR TABS */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Room Tabs */}
              <div className="flex flex-wrap gap-2">
                {(['living', 'bedroom', 'kitchen', 'bath'] as RoomId[]).map((roomId) => (
                  <button
                    key={roomId}
                    onClick={() => setSelectedRoom(roomId)}
                    className={`px-4 py-2 text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                      selectedRoom === roomId ? 'translate-y-1' : 'hover:-translate-y-0.5'
                    }`}
                    style={{
                      backgroundColor: selectedRoom === roomId ? colors.accent : '#ffffff',
                      color: colors.primary,
                      borderColor: colors.primary,
                      boxShadow: selectedRoom === roomId ? 'none' : `4px 4px 0 ${colors.primary}`,
                    }}
                  >
                    {roomId === 'living' ? '🛋️ Living' : roomId === 'bedroom' ? '🛏️ Bedroom' : roomId === 'kitchen' ? '🍳 Kitchen' : '🛁 Bath'}
                  </button>
                ))}
              </div>

              {/* View Mode Switcher */}
              <div className="flex border-2" style={{ borderColor: colors.primary }}>
                <button
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                    viewMode === '3d' ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  3D Inspector
                </button>
                <button
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1 text-xs font-black uppercase cursor-pointer ${
                    viewMode === '2d' ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  2D Floorplan
                </button>
              </div>
            </div>

            {/* 3D ROOM INSPECTOR CONTAINER */}
            {viewMode === '3d' ? (
              <div 
                className="p-6 flex flex-col items-center gap-6 relative overflow-hidden"
                style={{ 
                  border: `4px solid ${colors.primary}`, 
                  backgroundColor: '#ffffff', 
                  boxShadow: `10px 10px 0 ${colors.primary}` 
                }}
              >
                {/* 3D View Controls Banner */}
                <div className="w-full flex justify-between items-center pb-3 border-b-2" style={{ borderColor: colors.primary }}>
                  <span className="text-xs font-black uppercase tracking-wider">
                    3D ROOM SPATIAL BOX: <span className="underline">{selectedRoom.toUpperCase()}</span>
                  </span>
                  
                  {/* Rotation Quick Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRotationY((r) => r - 45)}
                      className="px-2 py-1 text-xs font-black uppercase border cursor-pointer hover:bg-gray-100"
                      style={{ borderColor: colors.primary }}
                    >
                      ◀ Rotate Left
                    </button>
                    <button
                      onClick={() => { setRotationY(-35); setTiltX(-20); }}
                      className="px-2 py-1 text-xs font-black uppercase border cursor-pointer hover:bg-gray-100"
                      style={{ borderColor: colors.primary }}
                    >
                      Reset View
                    </button>
                    <button
                      onClick={() => setRotationY((r) => r + 45)}
                      className="px-2 py-1 text-xs font-black uppercase border cursor-pointer hover:bg-gray-100"
                      style={{ borderColor: colors.primary }}
                    >
                      Rotate Right ▶
                    </button>
                  </div>
                </div>

                {/* 3D PERSPECTIVE VIEWPORT */}
                <div 
                  className="w-full h-[400px] flex items-center justify-center relative my-4"
                  style={{ perspective: '1000px' }}
                >
                  {/* Rotating 3D Room Box */}
                  <div 
                    className="relative w-[280px] h-[220px] transition-transform duration-300 ease-out"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: `rotateX(${tiltX}deg) rotateY(${rotationY}deg)`
                    }}
                  >
                    {/* NORTH WALL (BACK) */}
                    <div 
                      onClick={() => setSelectedWall('north')}
                      className={`absolute inset-0 border-4 flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
                        selectedWall === 'north' ? 'ring-8 ring-black ring-offset-2 z-10' : ''
                      }`}
                      style={{
                        backgroundColor: currentRoomWalls.north,
                        borderColor: colors.primary,
                        transform: 'translateZ(-140px) rotateY(180deg)',
                      }}
                    >
                      <span className="text-xs font-black uppercase bg-white/90 px-2 py-1 border border-black text-black">
                        NORTH WALL
                      </span>
                      <span className="text-[10px] font-bold mt-1 bg-black text-white px-1">
                        {currentRoomWalls.north}
                      </span>
                    </div>

                    {/* EAST WALL (RIGHT) */}
                    <div 
                      onClick={() => setSelectedWall('east')}
                      className={`absolute inset-0 border-4 flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
                        selectedWall === 'east' ? 'ring-8 ring-black ring-offset-2 z-10' : ''
                      }`}
                      style={{
                        backgroundColor: currentRoomWalls.east,
                        borderColor: colors.primary,
                        transform: 'translateX(140px) rotateY(90deg)',
                      }}
                    >
                      <span className="text-xs font-black uppercase bg-white/90 px-2 py-1 border border-black text-black">
                        EAST WALL
                      </span>
                      <span className="text-[10px] font-bold mt-1 bg-black text-white px-1">
                        {currentRoomWalls.east}
                      </span>
                    </div>

                    {/* SOUTH WALL (FRONT / OPEN INSIGHT) */}
                    <div 
                      onClick={() => setSelectedWall('south')}
                      className={`absolute inset-0 border-4 border-dashed flex flex-col items-center justify-center p-4 cursor-pointer opacity-40 hover:opacity-90 transition-all ${
                        selectedWall === 'south' ? 'ring-8 ring-black ring-offset-2 z-10' : ''
                      }`}
                      style={{
                        backgroundColor: currentRoomWalls.south,
                        borderColor: colors.primary,
                        transform: 'translateZ(140px)',
                      }}
                    >
                      <span className="text-xs font-black uppercase bg-white/90 px-2 py-1 border border-black text-black">
                        SOUTH WALL
                      </span>
                      <span className="text-[10px] font-bold mt-1 bg-black text-white px-1">
                        {currentRoomWalls.south}
                      </span>
                    </div>

                    {/* WEST WALL (LEFT) */}
                    <div 
                      onClick={() => setSelectedWall('west')}
                      className={`absolute inset-0 border-4 flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
                        selectedWall === 'west' ? 'ring-8 ring-black ring-offset-2 z-10' : ''
                      }`}
                      style={{
                        backgroundColor: currentRoomWalls.west,
                        borderColor: colors.primary,
                        transform: 'translateX(-140px) rotateY(-90deg)',
                      }}
                    >
                      <span className="text-xs font-black uppercase bg-white/90 px-2 py-1 border border-black text-black">
                        WEST WALL
                      </span>
                      <span className="text-[10px] font-bold mt-1 bg-black text-white px-1">
                        {currentRoomWalls.west}
                      </span>
                    </div>

                    {/* FLOOR */}
                    <div 
                      onClick={() => setSelectedWall('floor')}
                      className={`absolute w-[280px] h-[280px] border-4 flex flex-col items-center justify-center p-4 cursor-pointer transition-all ${
                        selectedWall === 'floor' ? 'ring-8 ring-black ring-offset-2 z-10' : ''
                      }`}
                      style={{
                        backgroundColor: currentRoomWalls.floor,
                        borderColor: colors.primary,
                        transform: 'translateY(70px) rotateX(90deg)',
                      }}
                    >
                      {/* Grid Pattern on Floor */}
                      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />
                      <span className="text-xs font-black uppercase bg-white/90 px-2 py-1 border border-black text-black z-10">
                        FLOOR PLANET
                      </span>
                      <span className="text-[10px] font-bold mt-1 bg-black text-white px-1 z-10">
                        {currentRoomWalls.floor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3D Rotation Sliders */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2" style={{ borderColor: colors.primary }}>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-black uppercase flex justify-between">
                      <span>Horizontal Rotation (Y-Axis)</span>
                      <span>{rotationY}°</span>
                    </label>
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      value={rotationY} 
                      onChange={(e) => setRotationY(Number(e.target.value))}
                      className="accent-black cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-black uppercase flex justify-between">
                      <span>Vertical Tilt Angle (X-Axis)</span>
                      <span>{tiltX}°</span>
                    </label>
                    <input 
                      type="range" 
                      min="-60" 
                      max="30" 
                      value={tiltX} 
                      onChange={(e) => setTiltX(Number(e.target.value))}
                      className="accent-black cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* 2D ARCHITECTURAL FLOORPLAN VIEW */
              <div 
                className="p-4 md:p-6 overflow-x-auto"
                style={{ 
                  border: `4px solid ${colors.primary}`, 
                  backgroundColor: '#ffffff', 
                  boxShadow: `10px 10px 0 ${colors.primary}` 
                }}
              >
                <div className="flex justify-between items-center mb-4 pb-2 border-b-2" style={{ borderColor: colors.primary }}>
                  <span className="text-xs font-black uppercase tracking-widest">2D HOUSE LAYOUT VIEW</span>
                  <span className="text-xs font-black uppercase tracking-widest">SCALE 1:50</span>
                </div>

                <svg className="w-full min-w-[600px] h-auto" viewBox="0 0 800 580">
                  {/* Outer Wall Boundary */}
                  <rect x="10" y="10" width="780" height="560" fill="none" stroke={colors.primary} strokeWidth="10" />

                  {/* ROOM 1: KITCHEN & DINING */}
                  <g id="kitchen-2d" onClick={() => setSelectedRoom('kitchen')} className="cursor-pointer">
                    <rect x="15" y="15" width="350" height="240" fill={roomWalls.kitchen.floor} stroke={colors.primary} strokeWidth={selectedRoom === 'kitchen' ? 8 : 4} />
                    <rect x="80" y="80" width="180" height="70" fill={roomWalls.kitchen.north} stroke={colors.primary} strokeWidth="4" />
                    <text x="30" y="50" fill={colors.primary} fontSize="22" fontWeight="900">KITCHEN</text>
                  </g>

                  {/* ROOM 2: BATHROOM */}
                  <g id="bath-2d" onClick={() => setSelectedRoom('bath')} className="cursor-pointer">
                    <rect x="365" y="15" width="210" height="190" fill={roomWalls.bath.floor} stroke={colors.primary} strokeWidth={selectedRoom === 'bath' ? 8 : 4} />
                    <circle cx="530" cy="120" r="25" fill={roomWalls.bath.east} stroke={colors.primary} strokeWidth="4" />
                    <text x="380" y="50" fill={colors.primary} fontSize="22" fontWeight="900">BATH</text>
                  </g>

                  {/* ROOM 3: ENTRY / FOYER */}
                  <g id="entry-2d">
                    <rect x="575" y="15" width="215" height="190" fill={colors.background} stroke={colors.primary} strokeWidth="4" />
                    <text x="590" y="50" fill={colors.primary} fontSize="22" fontWeight="900">ENTRY</text>
                  </g>

                  {/* ROOM 4: LIVING SPACE */}
                  <g id="living-2d" onClick={() => setSelectedRoom('living')} className="cursor-pointer">
                    <rect x="15" y="255" width="435" height="315" fill={roomWalls.living.floor} stroke={colors.primary} strokeWidth={selectedRoom === 'living' ? 8 : 4} />
                    <polygon points="300,320 410,320 410,480 360,480 360,370 300,370" fill={roomWalls.living.east} stroke={colors.primary} strokeWidth="4" />
                    <text x="30" y="295" fill={colors.primary} fontSize="24" fontWeight="900">LIVING ROOM</text>
                  </g>

                  {/* ROOM 5: MASTER BEDROOM */}
                  <g id="bedroom-2d" onClick={() => setSelectedRoom('bedroom')} className="cursor-pointer">
                    <rect x="450" y="205" width="340" height="365" fill={roomWalls.bedroom.floor} stroke={colors.primary} strokeWidth={selectedRoom === 'bedroom' ? 8 : 4} />
                    <rect x="520" y="280" width="210" height="250" fill={roomWalls.bedroom.north} stroke={colors.primary} strokeWidth="4" />
                    <text x="470" y="245" fill={colors.primary} fontSize="24" fontWeight="900">BEDROOM</text>
                  </g>
                </svg>
              </div>
            )}
          </div>
        </main>

        {/* ROOM PALETTE HISTORY SECTION */}
        <section className="mt-6 pt-6 border-t-4" style={{ borderColor: colors.primary }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Stored Room Palette History</h3>
              <p className="text-xs font-bold uppercase opacity-80 mt-1">Saved automatically in LocalStorage • Click to restore</p>
            </div>
            <span className="text-xs font-black uppercase border-2 px-3 py-1" style={{ borderColor: colors.primary, backgroundColor: '#ffffff' }}>
              {history.length} Saved
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item, idx) => {
              const isActive = item.explanation === palette.explanation;
              return (
                <div
                  key={item.id || idx}
                  onClick={() => updatePaletteState(item)}
                  className={`p-4 border-4 transition-all cursor-pointer flex flex-col justify-between ${
                    isActive ? 'scale-[1.02]' : 'hover:-translate-y-1'
                  }`}
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: colors.primary,
                    boxShadow: isActive ? `8px 8px 0 ${colors.primary}` : `4px 4px 0 ${colors.primary}`
                  }}
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black uppercase px-2 py-0.5 border" style={{ borderColor: colors.primary, backgroundColor: item.colors.accent }}>
                        Option #{history.length - idx}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs font-bold leading-snug line-clamp-2 mb-4 opacity-90">
                      "{item.explanation}"
                    </p>
                  </div>

                  <div className="grid grid-cols-4 h-8 border-2" style={{ borderColor: colors.primary }}>
                    <div style={{ backgroundColor: item.colors.background }} title={`BG: ${item.colors.background}`} />
                    <div style={{ backgroundColor: item.colors.primary }} title={`PRI: ${item.colors.primary}`} />
                    <div style={{ backgroundColor: item.colors.secondary }} title={`SEC: ${item.colors.secondary}`} />
                    <div style={{ backgroundColor: item.colors.accent }} title={`ACC: ${item.colors.accent}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}