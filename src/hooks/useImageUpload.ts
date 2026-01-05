'use client';

import { useState, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import imageCompression from 'browser-image-compression';

interface UploadOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    fileType?: string;
}

export function useImageUpload() {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const compressImage = async (file: File, options: UploadOptions = {}) => {
        const {
            maxSizeMB = 1,
            maxWidthOrHeight = 1920,
            fileType = 'image/webp'
        } = options;

        // すでにターゲット形式(WebP)であり、かつサイズが指定以下(100KB)なら
        // 圧縮・変換をスキップしてそのまま返す（再変換による劣化・肥大化防止）
        if (file.type === fileType && file.size < 100 * 1024) {
            return file;
        }

        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB,
                maxWidthOrHeight,
                useWebWorker: true,
                fileType,
            });
            return compressedFile;
        } catch (error) {
            console.error('画像圧縮エラー (using original file):', error);
            // DNGなどの非対応フォーマットや圧縮エラー時は元のファイルを返す
            return file;
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
            // 画像を圧縮 (失敗時は元のファイルが返る)
            setProgress(10);
            const processedFile = await compressImage(file, options);

            // ファイルタイプに基づいて拡張子を決定
            // 変換成功(=image/webp)なら .webp, 失敗(=元のまま)なら元の拡張子
            let extension = file.name.split('.').pop() || 'jpg';
            if (processedFile.type === 'image/webp') {
                extension = 'webp';
            } else if (processedFile.type === 'image/png') {
                extension = 'png';
            } else if (processedFile.type === 'image/jpeg') {
                extension = 'jpg';
            }



            // ユニークなファイル名を生成
            const timestamp = Date.now();
            const fileName = `${timestamp}.${extension}`;
            const fullPath = `${path}/${fileName}`;



            setProgress(30);

            // Firebase Storage にアップロード
            const storageRef = ref(storage, fullPath);
            await uploadBytes(storageRef, processedFile, {
                contentType: processedFile.type
            });

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
