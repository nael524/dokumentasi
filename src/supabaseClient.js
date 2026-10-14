import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xychyshydvftjcgdatap.supabase.co';
const supabaseAnonKey = 'sb_publishable_UX7R9pk7hhzhfTrEsCkJMw_8WSKyy9D';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);