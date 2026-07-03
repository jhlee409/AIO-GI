import assert from 'node:assert/strict';
import fs from 'node:fs';

const loginPageSource = fs.readFileSync(
  new URL('../app/login/page.tsx', import.meta.url),
  'utf8'
);
const sessionRouteSource = fs.readFileSync(
  new URL('../app/api/user/session/route.ts', import.meta.url),
  'utf8'
);
const adminUsersPageSource = fs.readFileSync(
  new URL('../app/(admin)/admin/users/page.tsx', import.meta.url),
  'utf8'
);
const autoLogoutSource = fs.readFileSync(
  new URL('../lib/hooks/useAutoLogout.ts', import.meta.url),
  'utf8'
);

assert.doesNotMatch(
  loginPageSource,
  /hasConcurrentSessions|동일한 계정이 다른 기기|관리자에게 알림/,
  'login page should not warn users about concurrent sessions'
);

assert.doesNotMatch(
  sessionRouteSource,
  /notify-concurrent-login|hasConcurrentSessions|activeSessions|existingSessions/,
  'user session route should not detect or notify concurrent logins'
);

assert.doesNotMatch(
  adminUsersPageSource,
  /동시 접속 발생 보고|showConcurrentLogins|concurrentLogins|selectedRecord|loadConcurrentLogins|loadRecordDetails|handleDeleteConcurrentLogin|\/api\/admin\/concurrent-logins/,
  'admin users page should not expose the concurrent login report UI'
);

assert.ok(
  !fs.existsSync(new URL('../app/api/admin/concurrent-logins/route.ts', import.meta.url)),
  'concurrent login admin API route should be removed'
);

assert.ok(
  !fs.existsSync(new URL('../app/api/admin/notify-concurrent-login/route.ts', import.meta.url)),
  'concurrent login notification API route should be removed'
);

assert.match(
  autoLogoutSource,
  /INACTIVITY_TIMEOUT\s*=\s*10\s*\*\s*60\s*\*\s*1000/,
  'auto logout should remain enabled with the 10 minute inactivity timeout'
);
