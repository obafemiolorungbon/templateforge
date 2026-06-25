import { createTemplateForgeApiClient } from '@templateforge/api-client';
import { demoCredentialHeaders } from './demo-credentials';

export const api = createTemplateForgeApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  credentialHeaders: demoCredentialHeaders,
});
