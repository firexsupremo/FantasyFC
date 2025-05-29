import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './Fantasyfc.css';
import jugadoresData from './jugadoresData/jugadores.json'; 

const Fantasyfc = ({ user }) => {
  // Estados iniciales
  const [topPlayer, setTopPlayer] = useState({
    name: "Cargando...",
    countryCode: "us",
    league: "Premier League",
    position: "Delantero",
    points: 0,
    value: "0M"
  });

  const [userData, setUserData] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(`fantasyfc-data-${user?.email}`)) || { 
      puntos: 0, 
      presupuesto: 5000,
      liga: null,
      misJugadores: []
    };
    return saved;
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vista, setVista] = useState(() => {
    return localStorage.getItem('fantasyfc-vista') || 'principal';
  });
  const [formLiga, setFormLiga] = useState({ nombre: '', propietario: '' });
  const [jugadores, setJugadores] = useState([]);
  const [confirmarCompra, setConfirmarCompra] = useState({ mostrar: false, jugador: null });
  const [filtrosActivos, setFiltrosActivos] = useState({
    posicion: null,
    orden: null
  });

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (error) throw error;

        if (data) {
          const datosUsuario = data.datos || userData;
          setUserData(datosUsuario);
          localStorage.setItem(`fantasyfc-data-${user.email}`, JSON.stringify(datosUsuario));
        }
      } catch (error) {
        setError("Error al cargar datos del usuario");
        console.error(error);
      }
    };

    if (user) {
      cargarDatosUsuario();
      fetchTopPlayer();
    }
  }, [user]);

  // Guardar datos del usuario al cambiar
 // Guardar datos del usuario al cambiar
useEffect(() => {
  const guardarDatosUsuario = async () => {
    if (!user) return;

    try {
      // 1. Guardar en localStorage
      localStorage.setItem(`fantasyfc-data-${user.email}`, JSON.stringify(userData));
      
      // 2. Guardar en Supabase
      const { data, error } = await supabase
        .from('usuarios')
        .upsert({
          email: user.email,
          datos: userData,
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        throw {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        };
      }

      console.log('Datos guardados exitosamente:', data);
    } catch (error) {
      console.error("Error al guardar datos:", {
        message: error.message || 'Error desconocido',
        details: error.details || 'No hay detalles adicionales',
        code: error.code || 'Código no disponible'
      });
      
      setError(`Error al guardar: ${error.message || 'Por favor intenta más tarde'}`);
    }
  };

  guardarDatosUsuario();
}, [userData, user]);

  
  // Guardar vista actual
  useEffect(() => {
    localStorage.setItem('fantasyfc-vista', vista);
  }, [vista]);

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
      setError("");
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

  // Cargar jugadores disponibles
  useEffect(() => {
    if (vista === 'comprar') {
      aplicarFiltros();
    }
  }, [vista, userData.misJugadores, filtrosActivos]);

  const aplicarFiltros = () => {
    let jugadoresFiltrados = jugadoresData.filter(jugador => 
      !userData.misJugadores.some(mj => mj.id === jugador.id)
    );

    // Filtro por posición
    if (filtrosActivos.posicion) {
      jugadoresFiltrados = jugadoresFiltrados.filter(j => j.posicion === filtrosActivos.posicion);
    }

    // Ordenamiento
    if (filtrosActivos.orden) {
      switch (filtrosActivos.orden) {
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
      }
    }
    
    setJugadores(jugadoresFiltrados);
  };

  const manejarFiltro = (tipo, categoria) => {
    setFiltrosActivos(prev => ({
      ...prev,
      [categoria]: prev[categoria] === tipo ? null : tipo
    }));
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('fantasyfc-vista');
    } catch (error) {
      setError('Error al cerrar sesión');
    }
  };

  const handleCrearLiga = () => setVista('crearLiga');

  const handleGuardarLiga = () => {
    if (!formLiga.nombre || !formLiga.propietario) {
      setError('Debes completar todos los campos');
      return;
    }

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
    setError(null);
  };

  const handleCompraJugador = () => {
    if (!userData.liga) {
      setError("Debes crear una liga antes de comprar jugadores");
      setVista('crearLiga');
      setConfirmarCompra({ mostrar: false, jugador: null });
      return;
    }

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
      setError("No tienes suficiente presupuesto para comprar este jugador.");
      setConfirmarCompra({ mostrar: false, jugador: null });
    }
  };

  const volverAPrincipal = () => setVista('principal');

  if (loading) return (
    <div className="fantasyfc-container">
      <h1>FANTASY FC</h1>
      <div className="loading-spinner"></div>
    </div>
  );

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
            {!userData.liga && (
              <button className="crear-liga-btn" onClick={handleCrearLiga}>
                Crear mi liga
              </button>
            )}
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
            <>
              <h2>No tienes una liga creada</h2>
              <button className="menu-btn" onClick={handleCrearLiga}>
                Crear liga
              </button>
              <button className="menu-btn volver-btn" onClick={volverAPrincipal}>
                Regresar
              </button>
            </>
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
            <div className="filtro-botones">
              <h3>Filtrar por posición:</h3>
              <div className="botones-filtro">
                {['Delantero', 'Portero', 'Mediocampista', 'Defensa', 'Lateral'].map(pos => (
                  <button
                    key={pos}
                    className={`filtro-btn ${filtrosActivos.posicion === pos ? 'activo' : ''}`}
                    onClick={() => manejarFiltro(pos, 'posicion')}
                  >
                    {pos}
                  </button>
                ))}
              </div>
              
              <h3>Ordenar por:</h3>
              <div className="botones-filtro">
                {['Valor Alto', 'Valor Bajo', 'Puntos Altos', 'Puntos Bajos'].map(orden => {
                  const tipo = orden.toLowerCase().replace(' ', '-');
                  return (
                    <button
                      key={tipo}
                      className={`filtro-btn ${filtrosActivos.orden === tipo ? 'activo' : ''}`}
                      onClick={() => manejarFiltro(tipo, 'orden')}
                    >
                      {orden}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="jugadores-lista">
            {jugadores.length > 0 ? (
              jugadores.map((jugador) => (
                <div className="player-card" key={jugador.id}>
                  <div className="player-header">
                    <img 
                      src={`https://flagcdn.com/w40/${jugador.bandera}.png`} 
                      className="player-flag" 
                      alt={`Bandera de ${jugador.bandera}`}
                      onError={(e) => { e.target.src = 'https://flagcdn.com/w40/us.png'; }}
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
              ))
            ) : (
              <div className="no-jugadores">
                <p>No hay jugadores disponibles con estos filtros</p>
              </div>
            )}
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
            {userData.misJugadores.length > 0 ? (
              userData.misJugadores.map((jugador) => (
                <div className="player-card" key={jugador.id}>
                  <div className="player-header">
                    <img 
                      src={`https://flagcdn.com/w40/${jugador.bandera}.png`} 
                      className="player-flag" 
                      alt={`Bandera de ${jugador.bandera}`}
                      onError={(e) => { e.target.src = 'https://flagcdn.com/w40/us.png'; }}
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
              ))
            ) : (
              <div className="no-jugadores">
                <p>Aún no tienes jugadores en tu equipo</p>
                <button className="menu-btn" onClick={() => setVista('comprar')}>
                  Ir a comprar jugadores
                </button>
              </div>
            )}
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
        <button 
          className="menu-btn" 
          onClick={() => {
            if (!userData.liga) {
              setError("Debes crear una liga antes de comprar jugadores");
              setVista('crearLiga');
            } else {
              setVista('comprar');
            }
          }}
        >
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