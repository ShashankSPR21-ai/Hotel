import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon/Public Key from your Supabase Project Settings -> API
const SUPABASE_URL = 'https://sypndylnwiwisjsgxvic.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_inCFApOj9nbl4rxvSu9dGw_6P0aoiUj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const RAZORPAY_KEY_ID = 'rzp_test_TmHhxWkUlDoYzK';