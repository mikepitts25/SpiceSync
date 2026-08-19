export type AuthConfig = {
  googleWebClientId: string | null;
  googleIosClientId: string | null;
};

export class AuthFlowError extends Error {
  readonly code: string;

  constructor(code: string, message = code) {
    super(message);
    this.name = 'AuthFlowError';
    this.code = code;
  }
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function readAuthConfig(): AuthConfig {
  return {
    googleWebClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
    googleIosClientId: clean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  };
}
