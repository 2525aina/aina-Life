'use client';

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export const useStorage = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (
    file: Blob | File,
    baseFileName: string,
    directory: string = 'images'
  ): Promise<string> => {
    if (!user) {
      const authError = new Error('User is not authenticated.');
      setError(authError);
      throw authError;
    }

    if (!file) {
      const fileError = new Error('No file provided.');
      setError(fileError);
      throw fileError;
    }

    setUploading(true);
    setError(null);

    try {
      // Create a unique file name
      const fileName = `${Date.now()}_${baseFileName}.webp`;
      const storageRef = ref(storage, `${directory}/${user.uid}/${fileName}`);

      // Upload the file using uploadBytes
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: 'image/webp',
      });

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      setUploading(false);
      return downloadURL;
    } catch (e) {
      const uploadError = e instanceof Error ? e : new Error('File upload failed');
      console.error("File upload failed:", uploadError);
      setError(uploadError);
      setUploading(false);
      throw uploadError;
    }
  };

  return { uploadFile, uploading, error };
};
