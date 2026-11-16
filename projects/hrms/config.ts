import path from 'path';

export const hrmsConfig = {
  baseUrl: process.env.HRMS_BASE_URL ?? 'https://hrms.example.com',
  credentials: {
    username: process.env.HRMS_USERNAME ?? '',
    password: process.env.HRMS_PASSWORD ?? '',
  },
  auth: {
    // Stored session so tests can skip the login form after the first run.
    storageStatePath: path.resolve(__dirname, '.auth/session.json'),
  },
  routes: {
    login: '/login',
    dashboard: '/dashboard',
    myTeam: '/my-team',
  },
} as const;
