import path from 'path';

export const hrmsConfig = {
  baseUrl: process.env.HRMS_BASE_URL ?? 'http://localhost:8000',
  credentials: {
    username: process.env.HRMS_USERNAME ?? '',
    password: process.env.HRMS_PASSWORD ?? '',
  },
  auth: {
    storageStatePath: path.resolve(__dirname, '.auth/session.json'),
  },
  routes: {
    login: '/login',
    home: '/',
    launchpad: '/launchpad',
    myTeam: '/my-team',
  },
} as const;
