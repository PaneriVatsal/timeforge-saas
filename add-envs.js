import { execSync } from 'child_process';
const envs = [
  ['VITE_SUPABASE_URL', 'https://chqscesmkknrftqpeglb.supabase.co'],
  ['VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocXNjZXNta2tucmZ0cXBlZ2xiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTQyMDYsImV4cCI6MjA4OTIzMDIwNn0.Dh06UMrsAXTkEKnzgM3Owx40CNu_Olr6OZ0Nt0ufq-M']
];

for (const [key, val] of envs) {
  try {
    console.log(`Adding ${key}...`);
    // Skip the prompt using shell redirection
    execSync(`echo y | npx vercel env add ${key} production ${val}`, { stdio: 'inherit', shell: true });
  } catch (e) {
    console.error(`Failed to add ${key}:`, e.message);
  }
}
