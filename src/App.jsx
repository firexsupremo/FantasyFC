import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Autenticacion from './componentes/Autenticacion';
import Fantasyfc from './componentes/Fantasyfc';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Verificar sesión al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    // Escuchar cambios de autenticación
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
  }, []);

  return (
    <div className="app">
      {user ? <Fantasyfc /> : <Autenticacion />}
    </div>
  );
}

export default App;