import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

// For production mobile apps, we load from the deployed web app
// This is the simplest approach for a Next.js app with API routes
const PRODUCTION_URL = 'https://quest-manas-pradhans-projects.vercel.app';
const DEV_URL = 'http://localhost:3000';

const config: CapacitorConfig = {
  appId: 'com.quest.app',
  appName: 'Quest',
  webDir: 'public', // Minimal web dir, we load from server
  server: {
    // Load from deployed server (or localhost in dev)
    // This allows API routes to work since they're on the server
    url: process.env.NODE_ENV === 'development' ? DEV_URL : PRODUCTION_URL,
    cleartext: true  // Allow HTTP for localhost development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true
    }
  },
  ios: {
    scheme: "Quest",
    // Allow navigation to the server URL
    allowsLinkPreview: true
  },
  android: {
    allowMixedContent: true  // Allow HTTP for development
  }
};

export default config;
