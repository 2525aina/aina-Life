'use client';

import { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import imageCompression from 'browser-image-compression';

interface UploadOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
}

export function useImageUpload() {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const compressImage = async (file: File, options: UploadOptions = {}) => {
        const { maxSizeMB = 1, maxWidthOrHeight = 1920 } = options;

        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB,
                maxWidthOrHeight,
                useWebWorker: true,
            });
            return compressedFile;
        } catch (error) {
            console.error('画像圧縮エラー:', error);
            return file; // 圧縮に失敗した場合は元のファイルを使用
        }
    };

    const uploadImage = useCallback(async (
        file: File,
        path: string,
        options: UploadOptions = {}
    ): Promise<string> => {
        if (!user) throw new Error('認証が必要です');

        setUploading(true);
        setProgress(0);

        try {
            // 画像を圧縮
            setProgress(10);
            const compressedFile = await compressImage(file, options);

            // ユニークなファイル名を生成
            const timestamp = Date.now();
            const extension = file.name.split('.').pop() || 'jpg';
            const fileName = `${timestamp}.${extension}`;
            const fullPath = `${path}/${fileName}`;

            setProgress(30);

            // Firebase Storage にアップロード
            const storageRef = ref(storage, fullPath);
            await uploadBytes(storageRef, compressedFile);

            setProgress(80);

            // ダウンロードURLを取得
            const downloadURL = await getDownloadURL(storageRef);

            setProgress(100);
            return downloadURL;
        } finally {
            setUploading(false);
        }
    }, [user]);

    const uploadEntryImage = useCallback(async (file: File, petId: string): Promise<string> => {
        return uploadImage(file, `pets/${petId}/entries`, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
        });
    }, [uploadImage]);

    const uploadPetAvatar = useCallback(async (file: File, petId: string): Promise<string> => {
        return uploadImage(file, `pets/${petId}/avatar`, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 512,
        });
    }, [uploadImage]);

    const uploadUserAvatar = useCallback(async (file: File): Promise<string> => {
        if (!user) throw new Error('認証が必要です');
        return uploadImage(file, `users/${user.uid}/avatar`, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 512,
        });
    }, [user, uploadImage]);

    const deleteImage = useCallback(async (url: string) => {
        try {
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
        } catch (error) {
            console.error('画像削除エラー:', error);
        }
    }, []);

    return {
        uploading,
        progress,
        uploadImage,
        uploadEntryImage,
        uploadPetAvatar,
        uploadUserAvatar,
        deleteImage,
    };
}
