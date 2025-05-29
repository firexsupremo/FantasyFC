import React, { useState } from 'react';
import { supabase } from '../supabase';
import './Autenticacion.css';

const Autenticacion = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modo, setModo] = useState('iniciar');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const validarPassword = (pass) => {
    if (pass.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    if (!/[A-Z]/.test(pass)) return "Debe contener al menos una mayúscula";
    if (!/[0-9]/.test(pass)) return "Debe contener al menos un número";
    return null;
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      if (modo === 'registrar') {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        
        const passwordError = validarPassword(password);
        if (passwordError) {
          throw new Error(passwordError);
        }
      }

      if (modo === 'iniciar') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('¡Registro exitoso! Por favor verifica tu correo electrónico.');
        setModo('iniciar'); // Cambiar a login después de registro
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
          />
        </div>

        {modo === 'registrar' && (
          <div className="grupo-formulario">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
        )}
        
        <button 
          type="submit" 
          className="boton-principal"
          disabled={cargando}
        >
          {cargando ? 'Procesando...' : modo === 'iniciar' ? 'Iniciar Sesión' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
};

export default Autenticacion;