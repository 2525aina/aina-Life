// src/workers/image.worker.ts
/// <reference lib="webworker" />

import { AppSettings } from '@/hooks/useAppSettings';

interface WorkerData {
  file: File;
  settings: AppSettings;
}

self.onmessage = async (event: MessageEvent<WorkerData>) => {
  const { file, settings } = event.data;

  try {
    // 1. Decode image and correct EXIF orientation using createImageBitmap
    const imageBitmap = await createImageBitmap(file);

    const { width, height } = imageBitmap;
    let newWidth = width;
    let newHeight = height;

    // 2. Calculate new dimensions while maintaining aspect ratio
    const { maxImageDimension } = settings;
    if (width > maxImageDimension || height > maxImageDimension) {
      if (width > height) {
        newWidth = maxImageDimension;
        newHeight = (height * maxImageDimension) / width;
      } else {
        newHeight = maxImageDimension;
        newWidth = (width * maxImageDimension) / height;
      }
    }

    // 3. Use OffscreenCanvas to draw and resize the image
    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from OffscreenCanvas.');
    }
    ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);
    imageBitmap.close(); // Free up memory

    // 4. Convert canvas to WebP Blob
    // Note: ImageEncoder API is not yet widely supported.
    // We will use canvas.convertToBlob as the primary implementation.
    const blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: settings.compressionQuality,
    });

    if (!blob) {
      throw new Error('Canvas to Blob conversion failed.');
    }

    // 5. Send the processed blob back to the main thread
    self.postMessage({ success: true, blob });

  } catch (error) {
    console.error('Error in image worker:', error);
    self.postMessage({ success: false, error: (error as Error).message });
  }
};

// This export is to keep TypeScript happy in 'isolatedModules' mode.
export {};
