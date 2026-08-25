export const RATE_LIMIT_CONFIG = {
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  LOCK_TIME_MINUTES: parseInt(process.env.LOCK_TIME_MINUTES || '15', 10),
  ATTEMPT_KEY_PREFIX: 'login_attempts:',
  LOCK_KEY_PREFIX: 'login_locked:',
};
