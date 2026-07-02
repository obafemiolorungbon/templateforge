export const DEMO_OPENROUTER_KEY_STORAGE =
  'templateforge.demo.openRouterApiKey';
export const DEMO_CENCORI_KEY_STORAGE = 'templateforge.demo.cencoriApiKey';
export const DEMO_SENDBYTE_KEY_STORAGE =
  'templateforge.demo.sendByteSandboxApiKey';

export const OPENROUTER_DEMO_KEY_HEADER = 'x-templateforge-openrouter-key';
export const CENCORI_DEMO_KEY_HEADER = 'x-templateforge-cencori-key';
export const SENDBYTE_DEMO_KEY_HEADER = 'x-templateforge-sendbyte-key';

export type DemoCredentials = {
  openRouterApiKey: string;
  cencoriApiKey: string;
  sendByteSandboxApiKey: string;
};

export function readDemoCredentials(): DemoCredentials {
  if (typeof window === 'undefined') {
    return {
      openRouterApiKey: '',
      cencoriApiKey: '',
      sendByteSandboxApiKey: '',
    };
  }

  return {
    openRouterApiKey:
      window.sessionStorage.getItem(DEMO_OPENROUTER_KEY_STORAGE) ?? '',
    cencoriApiKey:
      window.sessionStorage.getItem(DEMO_CENCORI_KEY_STORAGE) ?? '',
    sendByteSandboxApiKey:
      window.sessionStorage.getItem(DEMO_SENDBYTE_KEY_STORAGE) ?? '',
  };
}

export function writeDemoCredentials(credentials: DemoCredentials) {
  if (typeof window === 'undefined') {
    return;
  }

  const openRouterApiKey = credentials.openRouterApiKey.trim();
  const cencoriApiKey = credentials.cencoriApiKey.trim();
  const sendByteSandboxApiKey = credentials.sendByteSandboxApiKey.trim();

  if (openRouterApiKey) {
    window.sessionStorage.setItem(
      DEMO_OPENROUTER_KEY_STORAGE,
      openRouterApiKey,
    );
  } else {
    window.sessionStorage.removeItem(DEMO_OPENROUTER_KEY_STORAGE);
  }

  if (cencoriApiKey) {
    window.sessionStorage.setItem(DEMO_CENCORI_KEY_STORAGE, cencoriApiKey);
  } else {
    window.sessionStorage.removeItem(DEMO_CENCORI_KEY_STORAGE);
  }

  if (sendByteSandboxApiKey) {
    window.sessionStorage.setItem(
      DEMO_SENDBYTE_KEY_STORAGE,
      sendByteSandboxApiKey,
    );
  } else {
    window.sessionStorage.removeItem(DEMO_SENDBYTE_KEY_STORAGE);
  }

  window.dispatchEvent(new Event('templateforge-demo-credentials-change'));
}

export function clearDemoCredentials() {
  writeDemoCredentials({
    openRouterApiKey: '',
    cencoriApiKey: '',
    sendByteSandboxApiKey: '',
  });
}

export function demoCredentialHeaders() {
  const credentials = readDemoCredentials();
  const headers: Record<string, string> = {};

  if (credentials.openRouterApiKey) {
    headers[OPENROUTER_DEMO_KEY_HEADER] = credentials.openRouterApiKey;
  }

  if (credentials.cencoriApiKey) {
    headers[CENCORI_DEMO_KEY_HEADER] = credentials.cencoriApiKey;
  }

  if (credentials.sendByteSandboxApiKey) {
    headers[SENDBYTE_DEMO_KEY_HEADER] = credentials.sendByteSandboxApiKey;
  }

  return headers;
}

export function maskDemoKey(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Not set';
  }

  if (trimmed.length <= 10) {
    return `${trimmed.slice(0, 3)}...${trimmed.slice(-2)}`;
  }

  return `${trimmed.slice(0, 7)}...${trimmed.slice(-4)}`;
}
