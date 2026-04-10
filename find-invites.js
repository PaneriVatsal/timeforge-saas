import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findInvites() {
    console.log('--- FINDING INVITATIONS ---');
    const { data, error } = await supabase.from('invitations').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Invitations:', data);
    }
}

findInvites();
