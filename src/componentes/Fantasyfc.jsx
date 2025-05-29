import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './Fantasyfc.css';
import jugadoresData from './jugadoresData/jugadores.json'; 

const Fantasyfc = ({ user }) => {
  // Estado inicial
  const [topPlayer, setTopPlayer] = useState({
    name: "Cargando...",
    countryCode: "us",
    league: "Premier League",
    position: "Delantero",
    points: 0,
    value: "0M"
  });

  const [userData, setUserData] = useState({ 
    puntos: 0, 
    presupuesto: 5000,
    liga: null,
    misJugadores: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState('principal');
  const [formLiga, setFormLiga] = useState({ nombre: '', propietario: '' });
  const [jugadores, setJugadores] = useState([]);
  const [confirmarCompra, setConfirmarCompra] = useState({ mostrar: false, jugador: null });
  const [filtroPosicion, setFiltroPosicion] = useState('todos');

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (data) {
        setUserData(data.datos || { 
          puntos: 0, 
          presupuesto: 5000,
          liga: null,
          misJugadores: []
        });
      }
    };

    cargarDatosUsuario();
    fetchTopPlayer();
  }, [user]);

  // Guardar datos del usuario al cambiar
  useEffect(() => {
    const guardarDatosUsuario = async () => {
      await supabase
        .from('usuarios')
        .upsert({
          email: user.email,
          datos: userData,
          updated_at: new Date()
        });
    };

    if (user) {
      guardarDatosUsuario();
    }
  }, [userData, user]);

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
    const map = { 
      'England': 'gb', 'Spain': 'es', 'France': 'fr', 
      'Germany': 'de', 'Brazil': 'br', 'Argentina': 'ar', 
      'Portugal': 'pt', 'Norway': 'no', 'Belgium': 'be',
      'Netherlands': 'nl'
    };
    return map[nationality]?.toLowerCase() || 'us';
  };

  // Cargar jugadores disponibles (quitando los que ya compró)
  useEffect(() => {
    if (vista === 'comprar') {
      const jugadoresDisponibles = jugadoresData.filter(jugador => 
        !userData.misJugadores.some(mj => mj.id === jugador.id)
      );
      setJugadores(jugadoresDisponibles);
    }
  }, [vista, userData.misJugadores]);

  const aplicarFiltro = (tipo) => {
    let jugadoresFiltrados = [...jugadores];
    
    // Filtro por posición
    if (filtroPosicion !== 'todos') {
      jugadoresFiltrados = jugadoresFiltrados.filter(j => j.posicion === filtroPosicion);
    }
    
    // Ordenamiento
    switch (tipo) {
      case 'valor-alto': 
        jugadoresFiltrados.sort((a, b) => b.valor - a.valor); 
        break;
      case 'valor-bajo': 
        jugadoresFiltrados.sort((a, b) => a.valor - b.valor); 
        break;
      case 'puntos-altos': 
        jugadoresFiltrados.sort((a, b) => b.puntos - a.puntos); 
        break;
      case 'puntos-bajos': 
        jugadoresFiltrados.sort((a, b) => a.puntos - b.puntos); 
        break;
      default:
        // Sin ordenamiento adicional
    }
    
    setJugadores(jugadoresFiltrados);
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
    const nuevaLiga = { 
      nombre: formLiga.nombre, 
      propietario: formLiga.propietario, 
      puntos: userData.puntos 
    };
    setUserData(prev => ({
      ...prev,
      liga: nuevaLiga
    }));
    setFormLiga({ nombre: '', propietario: '' });
    setVista('principal');
  };

  const handleCompraJugador = () => {
    const jugador = confirmarCompra.jugador;
    if (userData.presupuesto >= jugador.valor) {
      const nuevosPuntos = userData.puntos + jugador.puntos;
      
      setUserData(prev => ({
        ...prev,
        presupuesto: prev.presupuesto - jugador.valor,
        puntos: nuevosPuntos,
        misJugadores: [...prev.misJugadores, jugador],
        liga: prev.liga ? {
          ...prev.liga,
          puntos: nuevosPuntos
        } : prev.liga
      }));
      
      setConfirmarCompra({ mostrar: false, jugador: null });
    } else {
      alert("No tienes suficiente presupuesto para comprar este jugador.");
      setConfirmarCompra({ mostrar: false, jugador: null });
    }
  };

  const volverAPrincipal = () => setVista('principal');

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
              <img 
                src={`https://flagcdn.com/w40/${topPlayer.countryCode}.png`} 
                className="player-flag" 
                onError={(e) => { e.target.src = 'https://flagcdn.com/w40/us.png'; }} 
                alt={`Bandera de ${topPlayer.countryCode}`}
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
        </>
      )}

      {vista === 'liga' && (
        <div className="liga-card player-card">
          {userData.liga ? (
            <>
              <h2>{userData.liga.nombre}</h2>
              <p><strong>Propietario:</strong> {userData.liga.propietario}</p>
              <p><strong>Puntos de la liga:</strong> ⭐ {userData.liga.puntos}</p>
              <p><strong>Jugadores en propiedad:</strong> {userData.misJugadores.length}</p>
              <button className="menu-btn" onClick={volverAPrincipal}>
                Regresar al menú principal
              </button>
            </>
          ) : (
            <button className="menu-btn" onClick={handleCrearLiga}>
              Crear liga
            </button>
          )}
        </div>
      )}

      {vista === 'crearLiga' && (
        <div className="liga-card player-card">
          <h2>Crear nueva liga</h2>
          <input 
            type="text" 
            placeholder="Nombre de la liga" 
            value={formLiga.nombre} 
            onChange={(e) => setFormLiga({ ...formLiga, nombre: e.target.value })} 
            className="input-field" 
          />
          <input 
            type="text" 
            placeholder="Nombre del propietario" 
            value={formLiga.propietario} 
            onChange={(e) => setFormLiga({ ...formLiga, propietario: e.target.value })} 
            className="input-field" 
          />
          <div className="botones-formulario">
            <button className="menu-btn" onClick={handleGuardarLiga}>
              Guardar
            </button>
            <button className="menu-btn volver-btn" onClick={volverAPrincipal}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {vista === 'comprar' && (
        <>
          <div className="filtro-container">
            <div className="filtro-posicion">
              <label>Filtrar por posición:</label>
              <select 
                value={filtroPosicion} 
                onChange={(e) => setFiltroPosicion(e.target.value)}
                className="select-posicion"
              >
                <option value="todos">Todos</option>
                <option value="Delantero">Delantero</option>
                <option value="Mediocampista">Mediocampista</option>
                <option value="Portero">Portero</option>
                <option value="Defensa">Defensa</option>
                <option value="Lateral">Lateral</option>
              </select>
            </div>
            
            <div className="filtro-orden">
              <button className="menu-btn" onClick={() => aplicarFiltro('valor-alto')}>
                Valor Alto
              </button>
              <button className="menu-btn" onClick={() => aplicarFiltro('valor-bajo')}>
                Valor Bajo
              </button>
              <button className="menu-btn" onClick={() => aplicarFiltro('puntos-altos')}>
                Puntos Altos
              </button>
              <button className="menu-btn" onClick={() => aplicarFiltro('puntos-bajos')}>
                Puntos Bajos
              </button>
            </div>
          </div>

          <div className="jugadores-lista">
            {jugadores.map((jugador) => (
              <div className="player-card" key={jugador.id}>
                <div className="player-header">
                  <img 
                    src={`https://flagcdn.com/w40/${jugador.bandera}.png`} 
                    className="player-flag" 
                    alt={`Bandera de ${jugador.bandera}`}
                  />
                </div>
                <h2>{jugador.nombre}</h2>
                <div className="player-stats">
                  <p><strong>Liga:</strong> {jugador.liga}</p>
                  <p><strong>Posición:</strong> {jugador.posicion}</p>
                  <p><strong>Puntos:</strong> ⭐ {jugador.puntos}</p>
                  <p><strong>Valor:</strong> ${jugador.valor}M</p>
                </div>
                <button 
                  className="menu-btn" 
                  onClick={() => setConfirmarCompra({ mostrar: true, jugador })}
                >
                  Comprar
                </button>
              </div>
            ))}
          </div>
          
          <button className="menu-btn volver-btn" onClick={volverAPrincipal}>
            Regresar al menú principal
          </button>
        </>
      )}

      {vista === 'misJugadores' && (
        <>
          <h2>Mis jugadores</h2>
          <div className="jugadores-lista">
            {userData.misJugadores.map((jugador) => (
              <div className="player-card" key={jugador.id}>
                <div className="player-header">
                  <img 
                    src={`https://flagcdn.com/w40/${jugador.bandera}.png`} 
                    className="player-flag" 
                    alt={`Bandera de ${jugador.bandera}`}
                  />
                </div>
                <h2>{jugador.nombre}</h2>
                <div className="player-stats">
                  <p><strong>Liga:</strong> {jugador.liga}</p>
                  <p><strong>Posición:</strong> {jugador.posicion}</p>
                  <p><strong>Puntos:</strong> ⭐ {jugador.puntos}</p>
                  <p><strong>Valor:</strong> ${jugador.valor}M</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="menu-btn volver-btn" onClick={volverAPrincipal}>
            Regresar al menú principal
          </button>
        </>
      )}

      {confirmarCompra.mostrar && (
        <div className="modal">
          <div className="modal-content">
            <h3>¿Estás seguro de comprar a {confirmarCompra.jugador.nombre}?</h3>
            <p>Costará ${confirmarCompra.jugador.valor}M de tu presupuesto.</p>
            <div className="botones-modal">
              <button className="menu-btn" onClick={handleCompraJugador}>
                Sí, comprar
              </button>
              <button 
                className="menu-btn volver-btn" 
                onClick={() => setConfirmarCompra({ mostrar: false, jugador: null })}
              >
                No, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="menu-grid">
        <button className="menu-btn" onClick={() => setVista('liga')}>
          Mi liga
        </button>
        <button className="menu-btn" onClick={() => setVista('misJugadores')}>
          Mis jugadores
        </button>
        <button className="menu-btn" onClick={() => setVista('comprar')}>
          Comprar jugadores
        </button>
        <button className="menu-btn" onClick={() => setVista('vender')}>
          Vender jugadores
        </button>
      </div>

      <button onClick={handleLogout} className="menu-btn logout-btn">
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Fantasyfc;