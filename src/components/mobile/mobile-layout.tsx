"use client";

import { useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Initialize mobile-specific features
    const initMobile = async () => {
      try {
        // Hide splash screen when app is ready
        await SplashScreen.hide();

        // Configure status bar
        if (Capacitor.getPlatform() === 'ios') {
          await StatusBar.setStyle({ style: Style.Dark });
        } else if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#000000' });
          await StatusBar.setStyle({ style: Style.Dark });
        }

        // Configure keyboard behavior
        await Keyboard.setAccessoryBarVisible({ isVisible: true });
        await Keyboard.setScroll({ isDisabled: false });
      } catch (error) {
        // Some plugins may not be available
        console.warn('Mobile init warning:', error);
      }
    };

    initMobile();

    // Keyboard listeners for scroll adjustment
    const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.paddingBottom = `${info.keyboardHeight}px`;
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.paddingBottom = '0px';
    });

    return () => {
      showListener.then(l => l.remove());
      hideListener.then(l => l.remove());
    };
  }, []);

  return (
    <div className="mobile-safe-area min-h-screen">
      {children}
    </div>
  );
}

// Safe area CSS classes to add to globals.css:
// .mobile-safe-area {
//   padding-top: env(safe-area-inset-top);
//   padding-bottom: env(safe-area-inset-bottom);
//   padding-left: env(safe-area-inset-left);
//   padding-right: env(safe-area-inset-right);
// }
