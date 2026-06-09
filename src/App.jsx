import React, { useState, useMemo, useEffect } from 'react';
import { useHA } from './hooks/useHA';
import { Lightbulb, Power, Speaker, Thermometer } from 'lucide-react';
import './index.css';

function TTSWidget({ entities, callService }) {
  const [message, setMessage] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [sendToAll, setSendToAll] = useState(false);

  const speakers = Object.values(entities)
    .filter(ent => ent.entity_id.startsWith('media_player.'))
    .sort((a, b) => {
      const nameA = a.attributes.friendly_name || a.entity_id;
      const nameB = b.attributes.friendly_name || b.entity_id;
      return nameA.localeCompare(nameB);
    });

  const quickMessages = [
    "We gaan eten, komen jullie naar beneden?",
    "Je moet zo gaan sporten, zorg dat je spullen gereed zijn.",
    "Goedemorgen, tijd om op te staan!",
    "De wasmachine is klaar."
  ];

  const handleSend = () => {
    if (!message) return;
    if (!sendToAll && !selectedSpeaker) return;
    
    // Bepaal naar wie het verstuurd moet worden
    const targets = sendToAll ? speakers.map(s => s.entity_id) : selectedSpeaker;

    callService('tts', 'google_translate_say', {
      entity_id: targets,
      message: message,
      language: 'nl'
    });
    setMessage('');
  };

  if (speakers.length === 0) return null;

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <h3 className="card-title">Omroepbericht (Tekst naar Spraak)</h3>
      <p className="card-subtitle" style={{ marginBottom: '1rem' }}>Typ een bericht of kies een standaard tekst</p>
      
      {/* Snelkeuze berichten (Quick Messages) */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {quickMessages.map((msg, idx) => (
          <button 
            key={idx}
            className="tab-btn"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)' }}
            onClick={() => setMessage(msg)}
          >
            {msg}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Selectievakje voor alle speakers */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input 
            type="checkbox" 
            checked={sendToAll}
            onChange={(e) => setSendToAll(e.target.checked)}
            style={{ width: '16px', height: '16px' }}
          />
          Alle speakers
        </label>

        {/* Verberg de dropdown als "Alle speakers" is geselecteerd */}
        {!sendToAll && (
          <select 
            style={{ padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)', flex: '1 1 200px' }}
            value={selectedSpeaker}
            onChange={(e) => setSelectedSpeaker(e.target.value)}
          >
            <option value="">Selecteer een speaker...</option>
            {speakers.map(s => (
              <option key={s.entity_id} value={s.entity_id}>{s.attributes.friendly_name || s.entity_id}</option>
            ))}
          </select>
        )}
        
        <input 
          type="text" 
          style={{ flex: '2 1 300px', padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}
          placeholder="Typ hier je bericht..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        
        <button 
          className="tab-btn active"
          onClick={handleSend}
          disabled={!message || (!sendToAll && !selectedSpeaker)}
          style={{ opacity: (!message || (!sendToAll && !selectedSpeaker)) ? 0.5 : 1, flex: '1 1 100px', textAlign: 'center' }}
        >
          Verstuur
        </button>
      </div>
    </div>
  );
}

function EntityCard({ entity, callService, isHidden, toggleHidden, isFavorite, toggleFavorite }) {
  const domain = entity.entity_id.split('.')[0];
  const isActive = entity.state === 'on' || entity.state === 'playing';
  const [sleepTimer, setSleepTimer] = useState(false);

  const toggleState = () => {
    const service = isActive ? 'turn_off' : 'turn_on';
    callService(domain, service, { entity_id: entity.entity_id });
  };

  const getIcon = () => {
    switch (domain) {
      case 'light': return <Lightbulb size={24} />;
      case 'media_player': return <Speaker size={24} />;
      case 'climate': return <Thermometer size={24} />;
      default: return <Power size={24} />;
    }
  };

  const HA_URL = import.meta.env.VITE_HA_URL || '';
  const bgImage = domain === 'media_player' && entity.attributes.entity_picture ? `url(${HA_URL}${entity.attributes.entity_picture})` : undefined;

  return (
    <div className="glass-card" style={{ 
      backgroundImage: bgImage, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center', 
      position: 'relative', 
      overflow: 'hidden' 
    }}>
      {bgImage && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 0 }} />}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="card-header">
        <div className={`entity-icon ${isActive ? 'active' : ''}`}>
          {getIcon()}
        </div>
        
        {(domain === 'light' || domain === 'switch') && (
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={toggleState} 
            />
            <span className="slider"></span>
          </label>
        )}
      </div>
      
      <div>
        <h3 className="card-title">{entity.attributes.friendly_name || entity.entity_id}</h3>
        
        {(entity.manufacturer || entity.model) && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            {entity.manufacturer} {entity.model ? `- ${entity.model}` : ''}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <p className="card-subtitle">
            Status: {entity.state === 'on' || entity.state === 'playing' ? 'Aan' : 'Uit'}
            {domain === 'light' && entity.attributes.brightness ? ` (${Math.round(entity.attributes.brightness / 2.55)}%)` : ''}
          </p>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '12px', color: 'var(--text-main)' }}>
            {entity.area_name}
          </span>
        </div>

        {domain === 'media_player' && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
            {/* Afspeel Informatie */}
            {entity.attributes.media_title ? (
              <div style={{ marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>🎵 {entity.attributes.media_title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entity.attributes.media_artist || 'Onbekende artiest'}</p>
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Niets aan het afspelen</p>
            )}

            {/* Media Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              {entity.state === 'playing' ? (
                <button 
                  className="tab-btn" 
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  onClick={() => callService('media_player', 'media_pause', { entity_id: entity.entity_id })}
                >
                  ⏸ Pauze
                </button>
              ) : (
                <button 
                  className="tab-btn" 
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  onClick={() => callService('media_player', 'media_play', { entity_id: entity.entity_id })}
                >
                  ▶ Play
                </button>
              )}
              <button 
                className="tab-btn" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                onClick={() => callService('media_player', 'media_stop', { entity_id: entity.entity_id })}
              >
                ⏹ Stop
              </button>
            </div>

            {/* Volume Control */}
            {entity.attributes.volume_level !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔈</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={Math.round(entity.attributes.volume_level * 100)} 
                  onChange={(e) => {
                    const newVol = e.target.value / 100;
                    callService('media_player', 'volume_set', { entity_id: entity.entity_id, volume_level: newVol });
                  }}
                  style={{ flex: 1, accentColor: 'var(--accent-color)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '25px' }}>{Math.round(entity.attributes.volume_level * 100)}%</span>
              </div>
            )}

            {/* Quick Playlists & Timer */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                className="tab-btn" 
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                onClick={() => callService('media_player', 'play_media', { 
                  entity_id: entity.entity_id, 
                  media_content_id: 'http://icecast-qmusicnl-cdp.triple-it.nl/Qmusic_nl_live_96.mp3', 
                  media_content_type: 'music' 
                })}
              >
                📻 Qmusic
              </button>
              <button 
                className="tab-btn" 
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: sleepTimer ? 'rgba(0,255,0,0.2)' : undefined }}
                onClick={() => {
                  setSleepTimer(true);
                  setTimeout(() => {
                    callService('media_player', 'media_stop', { entity_id: entity.entity_id });
                    setSleepTimer(false);
                  }, 30 * 60 * 1000);
                }}
                disabled={sleepTimer}
              >
                🌙 {sleepTimer ? 'Timer (30m)' : 'Slaaptimer'}
              </button>
            </div>
          </div>
        )}
        
        <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer'}}>
          <input 
            type="checkbox" 
            checked={isFavorite} 
            onChange={() => toggleFavorite(entity.entity_id)}
          />
          ⭐ Favoriet
        </label>
        
        <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer'}}>
          <input 
            type="checkbox" 
            checked={isHidden} 
            onChange={() => toggleHidden(entity.entity_id)}
          />
          Verberg
        </label>
      </div>
      </div>
    </div>
  );
}

function PartyModeWidget({ entities, callService }) {
  const speakers = Object.values(entities).filter(ent => ent.entity_id.startsWith('media_player.'));
  
  const handlePlayEverywhere = () => {
    const targets = speakers.map(s => s.entity_id);
    callService('media_player', 'play_media', {
      entity_id: targets,
      media_content_id: 'http://icecast-qmusicnl-cdp.triple-it.nl/Qmusic_nl_live_96.mp3',
      media_content_type: 'music'
    });
  };

  const handleMasterVolume = (e) => {
    const newVol = e.target.value / 100;
    const targets = speakers.map(s => s.entity_id);
    callService('media_player', 'volume_set', {
      entity_id: targets,
      volume_level: newVol
    });
  };

  if (speakers.length === 0) return null;

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <h3 className="card-title">🎉 Party Mode (Hele Huis)</h3>
      <p className="card-subtitle">Bedien al je speakers tegelijk</p>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="tab-btn active" onClick={handlePlayEverywhere}>
          ▶ Qmusic Overal Afspelen
        </button>
        <button className="tab-btn" onClick={() => callService('media_player', 'media_stop', { entity_id: speakers.map(s => s.entity_id) })}>
          ⏹ Alles Stoppen
        </button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Master Volume:</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          defaultValue="30"
          onChange={handleMasterVolume}
          style={{ flex: 1, accentColor: 'var(--accent-color)' }}
        />
      </div>
    </div>
  );
}

function App() {
  const { entities, areas, deviceRegistry, entityRegistry, error, loading, callService } = useHA();
  const [activeMainTab, setActiveMainTab] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState(null);
  
  const [hiddenEntities, setHiddenEntities] = useState(() => {
    const saved = localStorage.getItem('ha_hidden_entities');
    return saved ? JSON.parse(saved) : [];
  });

  const [favoriteEntities, setFavoriteEntities] = useState(() => {
    const saved = localStorage.getItem('ha_favorite_entities');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleHidden = (entityId) => {
    setHiddenEntities(prev => {
      const newHidden = prev.includes(entityId) 
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId];
      localStorage.setItem('ha_hidden_entities', JSON.stringify(newHidden));
      return newHidden;
    });
  };

  const toggleFavorite = (entityId) => {
    setFavoriteEntities(prev => {
      const newFav = prev.includes(entityId) 
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId];
      localStorage.setItem('ha_favorite_entities', JSON.stringify(newFav));
      return newFav;
    });
  };

  const areaMap = useMemo(() => {
    const map = {};
    if (areas) {
      areas.forEach(a => { map[a.area_id] = a.name; });
    }
    return map;
  }, [areas]);

  // Combineer live statussen met ruimte-informatie
  const entitiesWithAreas = useMemo(() => {
    const allowedDomains = ['light', 'switch', 'media_player', 'climate', 'automation'];
    
    return Object.values(entities)
      .filter(ent => allowedDomains.includes(ent.entity_id.split('.')[0]))
      .map(ent => {
        let areaId = null;
        let manufacturer = null;
        let model = null;
        
        // Zoek de ruimte, fabrikant en model via de entiteit en het apparaat-register
        if (entityRegistry && deviceRegistry) {
          const regEntry = entityRegistry.find(r => r.entity_id === ent.entity_id);
          if (regEntry) {
            if (regEntry.area_id) {
              areaId = regEntry.area_id;
            }
            
            if (regEntry.device_id) {
              const devEntry = deviceRegistry.find(d => d.id === regEntry.device_id);
              if (devEntry) {
                if (!areaId && devEntry.area_id) {
                  areaId = devEntry.area_id;
                }
                manufacturer = devEntry.manufacturer;
                model = devEntry.model;
              }
            }
          }
        }
        
        return {
          ...ent,
          area_id: areaId,
          area_name: areaId ? areaMap[areaId] : 'Overig',
          manufacturer: manufacturer,
          model: model
        };
      });
  }, [entities, entityRegistry, deviceRegistry, areaMap]);

  // Haal alleen de ruimtes op waar daadwerkelijk apparaten in staan
  const activeAreas = useMemo(() => {
    const map = {};
    entitiesWithAreas.forEach(ent => {
      if (ent.area_id && !hiddenEntities.includes(ent.entity_id)) {
        map[ent.area_id] = ent.area_name;
      }
    });
    return Object.entries(map).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [entitiesWithAreas, hiddenEntities]);

  // Automatisch de eerste subtab selecteren als er gewisseld wordt naar "Ruimtes"
  useEffect(() => {
    if (activeMainTab === 'rooms' && !activeSubTab) {
      setActiveSubTab('favorites');
    }
  }, [activeMainTab, activeSubTab]);

  // Filter apparaten op basis van geselecteerde tabs
  const displayEntities = useMemo(() => {
    if (activeMainTab === 'verborgen') {
      return entitiesWithAreas.filter(ent => hiddenEntities.includes(ent.entity_id));
    }

    const visibleEntities = entitiesWithAreas.filter(ent => !hiddenEntities.includes(ent.entity_id));
    
    // Automations hebben hun eigen speciale tab
    if (activeMainTab === 'automations') {
      return visibleEntities.filter(ent => ent.entity_id.startsWith('automation.'));
    }
    
    // Voor alle andere tabs, verberg automations zodat ze niet bij de normale apparaten staan
    const deviceEntities = visibleEntities.filter(ent => !ent.entity_id.startsWith('automation.'));

    if (activeMainTab === 'all') return deviceEntities;
    if (activeMainTab === 'speakers') return deviceEntities.filter(ent => ent.entity_id.startsWith('media_player.'));
    
    // We zitten in de "Ruimtes" (rooms) tab
    if (activeSubTab === 'favorites') return deviceEntities.filter(ent => favoriteEntities.includes(ent.entity_id));
    if (activeSubTab === 'overig') return deviceEntities.filter(ent => !ent.area_id);
    return deviceEntities.filter(ent => ent.area_id === activeSubTab);
  }, [entitiesWithAreas, activeMainTab, activeSubTab, hiddenEntities, favoriteEntities]);

  if (error) {
    return (
      <div className="loader">
        <h2 style={{color: '#ef4444'}}>Oeps, er ging iets mis!</h2>
        <p>{error}</p>
        <p>Controleer je .env bestand met de URL en Token.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-spinner"></div>
        <h2>Verbinden met Home Assistant...</h2>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div>
          <h1>Mijn Smart Home</h1>
          <p className="card-subtitle">Welkom op je nieuwe dashboard</p>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
           <div style={{width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e'}}></div>
           <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Verbonden</span>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeMainTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('all')}
        >
          Alle Apparaten
        </button>

        <button 
          className={`tab-btn ${activeMainTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('rooms')}
        >
          Ruimtes
        </button>

        <button 
          className={`tab-btn ${activeMainTab === 'speakers' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('speakers')}
        >
          Speakers
        </button>

        <button 
          className={`tab-btn ${activeMainTab === 'automations' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('automations')}
        >
          Automations
        </button>

        <button 
          className={`tab-btn ${activeMainTab === 'verborgen' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('verborgen')}
        >
          Verborgen
        </button>
      </div>

      {/* Sub Tabs voor Ruimtes */}
      {activeMainTab === 'rooms' && (
        <div className="tabs-container" style={{ marginBottom: '2rem', marginTop: '-1rem' }}>
          
          <button 
            className={`tab-btn ${activeSubTab === 'favorites' ? 'active' : ''}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setActiveSubTab('favorites')}
          >
            ⭐ Favorieten
          </button>

          {activeAreas.map(area => (
            <button 
              key={area.id}
              className={`tab-btn ${activeSubTab === area.id ? 'active' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setActiveSubTab(area.id)}
            >
              {area.name}
            </button>
          ))}

          {entitiesWithAreas.some(e => !e.area_id && !hiddenEntities.includes(e.entity_id)) && (
            <button 
              className={`tab-btn ${activeSubTab === 'overig' ? 'active' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setActiveSubTab('overig')}
            >
              Overig
            </button>
          )}
        </div>
      )}

      {/* Omroep Sectie (tonen bij Speakers tab) */}
      {activeMainTab === 'speakers' && (
        <>
          <PartyModeWidget entities={entities} callService={callService} />
          <TTSWidget entities={entities} callService={callService} />
        </>
      )}

      <main className="dashboard-grid">
        {displayEntities.map(entity => (
          <EntityCard 
            key={entity.entity_id} 
            entity={entity} 
            callService={callService} 
            isHidden={hiddenEntities.includes(entity.entity_id)}
            toggleHidden={toggleHidden}
            isFavorite={favoriteEntities.includes(entity.entity_id)}
            toggleFavorite={toggleFavorite}
          />
        ))}
        {displayEntities.length === 0 && (
          <p style={{color: 'var(--text-muted)', gridColumn: '1 / -1'}}>
            Geen apparaten gevonden.
          </p>
        )}
      </main>

      {/* Global Now Playing Mini-Player */}
      {(() => {
        const playingMediaPlayers = Object.values(entities).filter(
          e => e.entity_id.startsWith('media_player.') && e.state === 'playing'
        );
        const globalPlaying = playingMediaPlayers.length > 0 ? playingMediaPlayers[0] : null;
        
        if (!globalPlaying) return null;

        return (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {globalPlaying.attributes.entity_picture && (
                <img src={`${import.meta.env.VITE_HA_URL || ''}${globalPlaying.attributes.entity_picture}`} alt="cover" style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
              )}
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white', margin: 0 }}>{globalPlaying.attributes.media_title || 'Muziek'}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{globalPlaying.attributes.friendly_name} • {globalPlaying.attributes.media_artist || 'Radio'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="tab-btn" onClick={() => callService('media_player', 'media_pause', { entity_id: globalPlaying.entity_id })}>⏸ Pauze</button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

export default App;
