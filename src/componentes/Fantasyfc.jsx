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

  const [userData, setUserData] = useState({ puntos: 0, presupuesto: 5000 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('principal');
  const [liga, setLiga] = useState(null);
  const [formLiga, setFormLiga] = useState({ nombre: '', propietario: '' });
  const [jugadores, setJugadores] = useState([]);
  const [misJugadores, setMisJugadores] = useState([]);
  const [confirmarCompra, setConfirmarCompra] = useState({ mostrar: false, jugador: null });

  useEffect(() => {
    const fetchTopPlayer = async () => {
      try {
        const response = await fetch('https://api.football-data.org/v4/competitions/PL/scorers', {
          headers: { 'X-Auth-Token': 'ad226066046e8b2dcbcacd60ee671495' }
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
        setError(".");
        setTopPlayer({ name: "Erling Haaland", countryCode: "no", league: "Premier League", position: "Delantero", points: 28, value: "180M" });
      } finally {
        setLoading(false);
      }
    };

    const getCountryCode = (nationality) => {
      const map = { 'England': 'gb', 'Spain': 'es', 'France': 'fr', 'Germany': 'de', 'Brazil': 'br', 'Argentina': 'ar', 'Portugal': 'pt', 'Norway': 'no' };
      return map[nationality]?.toLowerCase() || 'us';
    };

    fetchTopPlayer();
  }, []);

  useEffect(() => {
    if (vista === 'comprar') {
      fetch(' https://mocki.io/v1/5f3d496e-2d64-4f75-9f89-f858cb270ba1')
        .then(res => res.json())
        .then(data => setJugadores(data))
        .catch(err => console.error('Error al cargar jugadores:', err));
    }
  }, [vista]);

  const aplicarFiltro = (tipo) => {
    const copia = [...jugadores];
    switch (tipo) {
      case 'valor-alto': copia.sort((a, b) => b.valor - a.valor); break;
      case 'valor-bajo': copia.sort((a, b) => a.valor - b.valor); break;
      case 'puntos-altos': copia.sort((a, b) => b.puntos - a.puntos); break;
      case 'puntos-bajos': copia.sort((a, b) => a.puntos - b.puntos); break;
    }
    setJugadores(copia);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setError('Error al cerrar sesión');
    }
  };

  const handleCrearLiga = () => setVista('crearLiga');

  const handleGuardarLiga = () => {
    const nueva = { nombre: formLiga.nombre, propietario: formLiga.propietario, puntos: 0 };
    setLiga(nueva);
    setFormLiga({ nombre: '', propietario: '' });
    setVista('principal');
  };

  const handleCompraJugador = () => {
    const jugador = confirmarCompra.jugador;
    if (userData.presupuesto >= jugador.valor) {
      setMisJugadores([...misJugadores, jugador]);
      setUserData(prev => ({ ...prev, presupuesto: prev.presupuesto - jugador.valor }));
      setConfirmarCompra({ mostrar: false, jugador: null });
    } else {
      alert("No tienes suficiente presupuesto para comprar este jugador.");
      setConfirmarCompra({ mostrar: false, jugador: null });
    }
  };

  if (loading) return <div className="fantasyfc-container"><h1>FANTASY FC</h1><p>Cargando...</p></div>;

  return (
    <div className="fantasyfc-container">
      <h1>FANTASY FC</h1>
      {error && <div className="error-message">{error}</div>}

      {vista === 'principal' && (
        <>
          <div className="player-card">
            <div className="player-header">
              <span className="player-rank">#1</span>
              <img src={`https://flagcdn.com/w40/${topPlayer.countryCode}.png`} className="player-flag" onError={(e) => { e.target.src = 'https://flagcdn.com/w40/us.png'; }} />
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
        </>
      )}

      {vista === 'liga' && (
        <div className="liga-card player-card">
          {liga ? (
            <>
              <h2>{liga.nombre}</h2>
              <p><strong>Propietario:</strong> {liga.propietario}</p>
              <p><strong>Puntos de la liga:</strong> ⭐ {liga.puntos}</p>
              <p><strong>Jugadores en propiedad:</strong> {misJugadores.length}</p>
              <button className="menu-btn" onClick={() => setVista('principal')}>Regresar al menú principal</button>
            </>
          ) : (
            <button className="menu-btn" onClick={handleCrearLiga}>Crear liga</button>
          )}
        </div>
      )}

      {vista === 'crearLiga' && (
        <div className="liga-card player-card">
          <h2>Crear nueva liga</h2>
          <input type="text" placeholder="Nombre de la liga" value={formLiga.nombre} onChange={(e) => setFormLiga({ ...formLiga, nombre: e.target.value })} className="input-field" />
          <input type="text" placeholder="Nombre del propietario" value={formLiga.propietario} onChange={(e) => setFormLiga({ ...formLiga, propietario: e.target.value })} className="input-field" />
          <button className="menu-btn" onClick={handleGuardarLiga}>Guardar</button>
        </div>
      )}

      {vista === 'comprar' && (
        <>
          <div className="filtro-container">
            <button className="menu-btn" onClick={() => aplicarFiltro('valor-alto')}>Valor Alto</button>
            <button className="menu-btn" onClick={() => aplicarFiltro('valor-bajo')}>Valor Bajo</button>
            <button className="menu-btn" onClick={() => aplicarFiltro('puntos-altos')}>Puntos Altos</button>
            <button className="menu-btn" onClick={() => aplicarFiltro('puntos-bajos')}>Puntos Bajos</button>
          </div>

          <div className="jugadores-grid">
            {jugadores.map((j, i) => (
              <div className="player-card" key={i}>
                <div className="player-header">
                  <img src={`https://flagcdn.com/w40/${j.bandera}.png`} className="player-flag" />
                </div>
                <h2>{j.nombre}</h2>
                <div className="player-stats">
                  <p><strong>Puntos:</strong> ⭐ {j.puntos}</p>
                  <p><strong>Valor:</strong> ${j.valor}M</p>
                </div>
                <button className="menu-btn" onClick={() => setConfirmarCompra({ mostrar: true, jugador: j })}>Comprar</button>
              </div>
            ))}
          </div>
        </>
      )}

      {vista === 'misJugadores' && (
        <>
          <h2>Mis jugadores</h2>
          <div className="jugadores-grid">
            {misJugadores.map((j, i) => (
              <div className="player-card" key={i}>
                <div className="player-header">
                  <img src={`https://flagcdn.com/w40/${j.bandera}.png`} className="player-flag" />
                </div>
                <h2>{j.nombre}</h2>
                <div className="player-stats">
                  <p><strong>Puntos:</strong> ⭐ {j.puntos}</p>
                  <p><strong>Valor:</strong> ${j.valor}M</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {confirmarCompra.mostrar && (
        <div className="modal">
          <div className="modal-content">
            <h3>¿Estás seguro de comprar a {confirmarCompra.jugador.nombre}?</h3>
            <button className="menu-btn" onClick={handleCompraJugador}>Sí</button>
            <button className="menu-btn volver-btn" onClick={() => setConfirmarCompra({ mostrar: false, jugador: null })}>No</button>
          </div>
        </div>
      )}

      <div className="menu-grid">
        <button className="menu-btn" onClick={() => setVista('liga')}>Mi liga</button>
        <button className="menu-btn" onClick={() => setVista('misJugadores')}>Mis jugadores</button>
        <button className="menu-btn" onClick={() => setVista('comprar')}>Comprar jugadores</button>
        <button className="menu-btn">Vender jugadores</button>
      </div>

      <button onClick={handleLogout} className="menu-btn logout-btn">Cerrar Sesión</button>
    </div>
  );
};

export default Fantasyfc;