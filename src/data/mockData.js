// ============================================
// Mock Data Service — Frontend-First Development
// All API calls will be replaced with real BE later
// ============================================

export const companies = [
  { id: 'c1', name: 'TechNova Solutions', domain: 'technova.io' },
  { id: 'c2', name: 'Greenfield Labs', domain: 'greenfield.co' },
];

export const users = [
  { id: 'u1', name: 'Arjun Mehta', email: 'arjun@technova.io', role: 'Admin', company_id: 'c1', avatar: null },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@technova.io', role: 'User', company_id: 'c1', avatar: null },
  { id: 'u3', name: 'Rahul Verma', email: 'rahul@technova.io', role: 'User', company_id: 'c1', avatar: null },
  { id: 'u4', name: 'Sneha Iyer', email: 'sneha@technova.io', role: 'User', company_id: 'c1', avatar: null },
  { id: 'u5', name: 'Vikram Das', email: 'vikram@technova.io', role: 'User', company_id: 'c1', avatar: null },
];

export const projects = [
  {
    id: 'p1',
    name: 'E-Commerce Platform',
    client: 'RetailMax Corp',
    budgeted_hours: 480,
    logged_hours: 312,
    company_id: 'c1',
    status: 'active',
    assigned_users: ['u1', 'u2', 'u3'],
    created_at: '2026-01-15',
  },
  {
    id: 'p2',
    name: 'Mobile Banking App',
    client: 'FinSecure Bank',
    budgeted_hours: 720,
    logged_hours: 85,
    company_id: 'c1',
    status: 'active',
    assigned_users: ['u1', 'u4'],
    created_at: '2026-02-20',
  },
  {
    id: 'p3',
    name: 'Healthcare Dashboard',
    client: 'MediCare Solutions',
    budgeted_hours: 320,
    logged_hours: 290,
    company_id: 'c1',
    status: 'active',
    assigned_users: ['u2', 'u5'],
    created_at: '2026-01-05',
  },
  {
    id: 'p4',
    name: 'Internal HR Portal',
    client: 'Internal',
    budgeted_hours: 200,
    logged_hours: 200,
    company_id: 'c1',
    status: 'completed',
    assigned_users: ['u3', 'u4', 'u5'],
    created_at: '2025-11-10',
  },
];

// Helper to generate time logs
const today = new Date();
const formatDate = (d) => d.toISOString().split('T')[0];
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
};

export const timeLogs = [
  // Today's entries
  {
    id: 'tl1',
    user_id: 'u1',
    project_id: 'p1',
    description: 'API endpoint refactoring for checkout flow',
    start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
    end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
    duration_minutes: 150,
    date: formatDate(today),
    company_id: 'c1',
  },
  {
    id: 'tl2',
    user_id: 'u1',
    project_id: 'p2',
    description: 'Sprint planning and architecture review',
    start_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(),
    end_time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 15).toISOString(),
    duration_minutes: 75,
    date: formatDate(today),
    company_id: 'c1',
  },
  // Yesterday
  {
    id: 'tl3',
    user_id: 'u1',
    project_id: 'p1',
    description: 'Payment gateway integration debugging',
    start_time: daysAgo(1).toISOString(),
    end_time: daysAgo(1).toISOString(),
    duration_minutes: 240,
    date: formatDate(daysAgo(1)),
    company_id: 'c1',
  },
  {
    id: 'tl4',
    user_id: 'u2',
    project_id: 'p1',
    description: 'UI wireframe for product listing page',
    start_time: daysAgo(1).toISOString(),
    end_time: daysAgo(1).toISOString(),
    duration_minutes: 180,
    date: formatDate(daysAgo(1)),
    company_id: 'c1',
  },
  {
    id: 'tl5',
    user_id: 'u2',
    project_id: 'p3',
    description: 'Dashboard widgets data binding',
    start_time: daysAgo(2).toISOString(),
    end_time: daysAgo(2).toISOString(),
    duration_minutes: 300,
    date: formatDate(daysAgo(2)),
    company_id: 'c1',
  },
  {
    id: 'tl6',
    user_id: 'u3',
    project_id: 'p1',
    description: 'Database schema optimization',
    start_time: daysAgo(2).toISOString(),
    end_time: daysAgo(2).toISOString(),
    duration_minutes: 120,
    date: formatDate(daysAgo(2)),
    company_id: 'c1',
  },
  {
    id: 'tl7',
    user_id: 'u4',
    project_id: 'p2',
    description: 'Biometric authentication flow design',
    start_time: daysAgo(3).toISOString(),
    end_time: daysAgo(3).toISOString(),
    duration_minutes: 360,
    date: formatDate(daysAgo(3)),
    company_id: 'c1',
  },
  {
    id: 'tl8',
    user_id: 'u5',
    project_id: 'p3',
    description: 'Patient data visualization charts',
    start_time: daysAgo(4).toISOString(),
    end_time: daysAgo(4).toISOString(),
    duration_minutes: 210,
    date: formatDate(daysAgo(4)),
    company_id: 'c1',
  },
  {
    id: 'tl9',
    user_id: 'u1',
    project_id: 'p1',
    description: 'Code review and PR merging',
    start_time: daysAgo(5).toISOString(),
    end_time: daysAgo(5).toISOString(),
    duration_minutes: 90,
    date: formatDate(daysAgo(5)),
    company_id: 'c1',
  },
  {
    id: 'tl10',
    user_id: 'u3',
    project_id: 'p4',
    description: 'Employee onboarding form validation',
    start_time: daysAgo(6).toISOString(),
    end_time: daysAgo(6).toISOString(),
    duration_minutes: 270,
    date: formatDate(daysAgo(6)),
    company_id: 'c1',
  },
];

// Utility to format minutes as "Xh Ym"
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Generate a unique ID
export function generateId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}
