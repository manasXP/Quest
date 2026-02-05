"use client";

import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

export type Platform = 'ios' | 'android' | 'web';

export interface PlatformInfo {
  isNative: boolean;
  platform: Platform;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    isNative: false,
    platform: 'web',
    isIOS: false,
    isAndroid: false,
    isWeb: true,
  });

  useEffect(() => {
    const platform = Capacitor.getPlatform() as Platform;
    const isNative = Capacitor.isNativePlatform();

    setPlatformInfo({
      isNative,
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web',
    });
  }, []);

  return platformInfo;
}

// Non-hook version for use outside components
export function getPlatform(): PlatformInfo {
  const platform = Capacitor.getPlatform() as Platform;
  const isNative = Capacitor.isNativePlatform();

  return {
    isNative,
    platform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
  };
}
