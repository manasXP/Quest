"use client";

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface PickedFile {
  path: string;
  webPath?: string;
  name: string;
  mimeType?: string;
}

/**
 * Pick an image from the device gallery
 */
export async function pickImage(): Promise<PickedFile | null> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('pickImage is only available on native platforms');
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    if (!image.path || !image.webPath) {
      return null;
    }

    return {
      path: image.path,
      webPath: image.webPath,
      name: image.path.split('/').pop() || 'image.jpg',
      mimeType: `image/${image.format}`,
    };
  } catch (error) {
    // User cancelled or error occurred
    console.error('Failed to pick image:', error);
    return null;
  }
}

/**
 * Take a photo with the device camera
 */
export async function takePhoto(): Promise<PickedFile | null> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('takePhoto is only available on native platforms');
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    if (!image.path || !image.webPath) {
      return null;
    }

    return {
      path: image.path,
      webPath: image.webPath,
      name: `photo_${Date.now()}.${image.format}`,
      mimeType: `image/${image.format}`,
    };
  } catch (error) {
    // User cancelled or error occurred
    console.error('Failed to take photo:', error);
    return null;
  }
}

/**
 * Pick a file or image - prompts user to choose source
 */
export async function pickFileOrImage(): Promise<PickedFile | null> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('pickFileOrImage is only available on native platforms');
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // Prompts user to choose camera or gallery
    });

    if (!image.path || !image.webPath) {
      return null;
    }

    return {
      path: image.path,
      webPath: image.webPath,
      name: image.path.split('/').pop() || `image.${image.format}`,
      mimeType: `image/${image.format}`,
    };
  } catch (error) {
    // User cancelled or error occurred
    console.error('Failed to pick file or image:', error);
    return null;
  }
}

/**
 * Convert a picked file to a Blob for uploading
 */
export async function pickedFileToBlob(file: PickedFile): Promise<Blob | null> {
  if (!file.webPath) {
    return null;
  }

  try {
    const response = await fetch(file.webPath);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Failed to convert file to blob:', error);
    return null;
  }
}
