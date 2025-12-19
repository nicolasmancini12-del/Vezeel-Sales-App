
import { createClient } from '@supabase/supabase-js';

// Credenciales del proyecto real del usuario (nchfxingtzpkwrwxynmy)
const supabaseUrl = 'https://nchfxingtzpkwrwxynmy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaGZ4aW5ndHpwa3dyd3h5bm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzAxNjIsImV4cCI6MjA4MTMwNjE2Mn0.OuyaRdo5rVA0O9RYe6_ZhwQjaSdBOeoCyq3w4m5hLFk';

export const supabase = createClient(supabaseUrl, supabaseKey);
