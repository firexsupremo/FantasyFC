import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uykxnnpnsxinenwrwprk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5a3hubnBuc3hpbmVud3J3cHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzcxMjgsImV4cCI6MjA2NDExMzEyOH0.HvarmkNgJfBjVo4zhyX6N4kb5dJ6njPhSTDWUWaL4Vk'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Añadir manejo de errores global
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Limpiar datos sensibles
  }
});