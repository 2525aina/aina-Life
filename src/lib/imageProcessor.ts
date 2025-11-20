// src/lib/imageProcessor.ts

import { AppSettings } from '@/hooks/useAppSettings';

/**
 * Processes an image file on the main thread as a fallback for browsers
 * that do not support OffscreenCanvas in Web Workers (e.g., iOS Safari).
 */
function processImageOnMainThread(file: File, settings: AppSettings): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const imageBitmap = await createImageBitmap(file);
      const { width, height } = imageBitmap;
      let newWidth = width;
      let newHeight = height;

      const { maxImageDimension } = settings;
      if (width > maxImageDimension || height > maxImageDimension) {
        if (width > height) {
          newWidth = maxImageDimension;
          newHeight = Math.round((height * maxImageDimension) / width);
        } else {
          newHeight = maxImageDimension;
          newWidth = Math.round((width * maxImageDimension) / height);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context from canvas.');
      }
      ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);
      imageBitmap.close();

      // Use the callback version of toBlob for broader compatibility
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas to Blob conversion failed.'));
          }
        },
        'image/webp',
        settings.compressionQuality
      );
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Processes an image file using a Web Worker if OffscreenCanvas is supported,
 * otherwise falls back to processing on the main thread.
 */
export function processImage(file: File, settings: AppSettings): Promise<Blob> {
  // Check for file size before starting any processing
  if (file.size > settings.maxUploadSizeMB * 1024 * 1024) {
    return Promise.reject(new Error(`ファイルサイズが大きすぎます。${settings.maxUploadSizeMB}MB以下のファイルを選択してください。`));
  }

  // Feature detection for OffscreenCanvas
  if (typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined') {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/image.worker.ts', import.meta.url));

      worker.onmessage = (event) => {
        const { success, blob, error } = event.data;
        if (success) {
          resolve(blob);
        } else {
          reject(new Error(`画像処理に失敗しました: ${error}`));
        }
        worker.terminate();
      };

      worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
        worker.terminate();
      };

      worker.postMessage({ file, settings });
    });
  } else {
    // Fallback for browsers without OffscreenCanvas support (e.g., iOS Safari)
    console.warn('OffscreenCanvas is not supported. Falling back to main thread processing.');
    return processImageOnMainThread(file, settings);
  }
}