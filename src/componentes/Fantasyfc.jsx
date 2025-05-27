import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './Fantasyfc.css';

const Fantasyfc = ({ user }) => {
  const [topPlayer, setTopPlayer] = useState({
    name: "Cargando...",
    countryCode: "us",
    league: "Premier League",
    position: "Delantero",
    points: 0,
    value: "0M"
  });
  
  const [userData, setUserData] = useState({
    puntos: 1200,
    presupuesto: 100
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopPlayer = async () => {
      try {
        const response = await fetch('https://api.football-data.org/v4/competitions/PL/scorers', {
          headers: {
            'X-Auth-Token': 'ad226066046e8b2dcbcacd60ee671495'
          }
        });
        
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        
        const data = await response.json();
        
        if (data.scorers?.length > 0) {
          const topScorer = data.scorers[0];
          setTopPlayer({
            name: topScorer.player.name,
            countryCode: getCountryCode(topScorer.player.nationality),
            league: "Premier League",
            position: "Delantero",
            points: topScorer.goals || 0,
            value: `${(topScorer.goals || 0) * 5}M`
          });
        }
      } catch (apiError) {
        console.error("Error con API principal:", apiError);
        setError(".");
        setTopPlayer({
          name: "Erling Haaland",
          countryCode: "no",
          league: "Premier League",
          position: "Delantero",
          points: 28,
          value: "180M"
        });
      } finally {
        setLoading(false);
      }
    };

    const getCountryCode = (nationality) => {
      const countryMap = {
        'England': 'gb', 'Spain': 'es', 'France': 'fr',
        'Germany': 'de', 'Brazil': 'br', 'Argentina': 'ar',
        'Portugal': 'pt', 'Norway': 'no'
      };
      return countryMap[nationality]?.toLowerCase() || 'us';
    };

    fetchTopPlayer();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
      setError('Error al cerrar sesión');
    }
  };

  if (loading) {
    return (
      <div className="fantasyfc-container">
        <div className="header">
          <h1>FANTASY FC</h1>
        </div>
        <div className="player-card loading">
          <div className="loading-spinner"></div>
          <p>Cargando datos del jugador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fantasyfc-container">
      <div className="header">
        <h1>FANTASY FC</h1>
        <button onClick={handleLogout} className="logout-btn">
          Cerrar Sesión
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="player-card">
        <div className="player-header">
          <span className="player-rank">#1</span>
          <img 
            src={`https://flagcdn.com/w40/${topPlayer.countryCode}.png`} 
            alt={topPlayer.countryCode}
            className="player-flag"
            onError={(e) => {
              e.target.src = 'https://flagcdn.com/w40/us.png';
            }}
          />
        </div>
        <h2>{topPlayer.name}</h2>
        <div className="player-stats">
          <p><strong>Liga:</strong> {topPlayer.league} ({topPlayer.position})</p>
          <p><strong>Puntos:</strong> ⭐ {topPlayer.points}</p>
          <p><strong>Valor:</strong> ${topPlayer.value}</p>
        </div>
      </div>

      <div className="user-stats">
        <p><strong>Mis puntos:</strong> {userData.puntos}</p>
        <p><strong>Mi presupuesto:</strong> ${userData.presupuesto}M</p>
      </div>

      <div className="menu-grid">
        <button className="menu-btn">Mi liga</button>
        <button className="menu-btn">Mis jugadores</button>
        <button className="menu-btn">Comprar jugadores</button>
        <button className="menu-btn">Vender jugadores</button>
      </div>
    </div>
  );
};

export default Fantasyfc;