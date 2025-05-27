import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vapsybggmnuvwtyisgjm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcHN5YmdnbW51dnd0eWlzZ2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDg1NTcsImV4cCI6MjA2Mzc4NDU1N30.VucX60IVYSGYtHn0mhXHspnijDN2pDvVXeXe5p1Ppcs'

export const supabase = createClient(supabaseUrl, supabaseKey)