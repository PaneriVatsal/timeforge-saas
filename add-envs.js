import { execSync } from 'child_process';
import 'dotenv/config';

const envs = [
  ['VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL],
  ['VITE_SUPABASE_ANON_KEY', process.env.VITE_SUPABASE_ANON_KEY]
];

// Simple shell escape function to prevent command injection
function shellEscape(str) {
  return `'${str.replace(/'/g, "'\\''")}'`;
}

for (const [key, val] of envs) {
  if (!val) {
    console.warn(`Skipping ${key} as it's not defined in .env`);
    continue;
  }
  try {
    console.log(`Adding ${key} to Vercel...`);
    // Pass values safely via stdin (first 'y' for confirmation, then the value)
    execSync(`printf '%s\n%s\n' 'y' ${shellEscape(val)} | npx vercel env add ${key} production`, { stdio: 'inherit', shell: true });
  } catch (e) {
    console.error(`Failed to add ${key}:`, e.message);
  }
}
