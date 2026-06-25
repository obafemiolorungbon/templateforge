export const OPENROUTER_DEMO_KEY_HEADER = 'x-templateforge-openrouter-key';
export const SENDBYTE_DEMO_KEY_HEADER = 'x-templateforge-sendbyte-key';

export type RequestRuntimeCredentials = {
  openRouterApiKey?: string;
  sendByteApiKey?: string;
};

export function runtimeCredentialsFromHeaders(headers: {
  openRouterApiKey?: string;
  sendByteApiKey?: string;
}): RequestRuntimeCredentials {
  return {
    openRouterApiKey: headers.openRouterApiKey?.trim() || undefined,
    sendByteApiKey: headers.sendByteApiKey?.trim() || undefined,
  };
}
