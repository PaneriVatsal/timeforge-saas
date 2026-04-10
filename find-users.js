import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function findUsers() {
    console.log('--- FINDING USERS ---');
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profiles:', data);
    }
}

findUsers().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
