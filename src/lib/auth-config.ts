export const AUTH_CONFIG = {
  clientId: import.meta.env.VITE_BOSCH_CLIENT_ID as string,
  redirectUri: 'https://localhost:8080/callback',
  authorizationEndpoint:
    'https://p9.authz.bosch.com/auth/realms/obc/protocol/openid-connect/auth',
  tokenEndpoint:
    'https://p9.authz.bosch.com/auth/realms/obc/protocol/openid-connect/token',
  scope: 'openid offline_access',
} as const
