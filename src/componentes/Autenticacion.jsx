import React, { useState } from 'react';
import { supabase } from '../supabase';
import './Autenticacion.css';

const Autenticacion = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modo, setModo] = useState('iniciar'); // 'iniciar' o 'registrar'
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      if (modo === 'iniciar') {
        // Iniciar sesión
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // Registrarse
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Esto evita que Supabase envíe el correo de confirmación
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setRegistroExitoso(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="autenticacion-contenedor">
      <div className="logo">
        <h1>Bienvenido a Fantasy FC</h1>
      </div>

      {registroExitoso ? (
        <div className="mensaje-exito">
          <h2>¡Registro exitoso!</h2>
          <p>Puedes iniciar sesión directamente con tu correo temporal.</p>
          <button 
            className="boton-principal"
            onClick={() => {
              setRegistroExitoso(false);
              setModo('iniciar');
            }}
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      ) : (
        <>
          <div className="opciones-autenticacion">
            <button 
              className={`boton-modo ${modo === 'iniciar' ? 'activo' : ''}`}
              onClick={() => setModo('iniciar')}
            >
              Iniciar Sesión
            </button>
            
            <button 
              className={`boton-modo ${modo === 'registrar' ? 'activo' : ''}`}
              onClick={() => setModo('registrar')}
            >
              Registrarse
            </button>
          </div>

          <form className="formulario-autenticacion" onSubmit={manejarEnvio}>
            {error && <div className="mensaje-error">{error}</div>}
            
            <div className="grupo-formulario">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
            
            <div className="grupo-formulario">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength="6"
              />
            </div>
            
            <button 
              type="submit" 
              className="boton-principal"
              disabled={cargando}
            >
              {cargando ? 'Procesando...' : modo === 'iniciar' ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Autenticacion;