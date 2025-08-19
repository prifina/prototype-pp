
// Environment configuration for AI Twin App
// Uses Supabase edge functions to securely access API endpoints

export const getEnvironmentConfig = () => {
  return {
    coreApiUrl: `${window.location.origin}/functions/v1/core-api`,
    middlewareApiUrl: `${window.location.origin}/functions/v1/middleware-api`,
    speakToCdn: 'cdn.speak-to.ai',
    myRegion: 'us-east-1',
    isDev: import.meta.env.VITE_APP_DEV === 'true',
    isDebug: import.meta.env.VITE_APP_DEBUG === 'true',
    appId: 'ai-twin-template',
    networkId: 'default'
  };
};
