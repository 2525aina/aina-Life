'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropper } from '@/components/ui/image-cropper';
import { Button } from '@/components/ui/button';
import { Camera, X, PawPrint } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PetAvatarEditorProps {
    imageUrl?: string | null;
    onImageChange: (file: File) => void;
    onImageRemove: () => void;
    disabled?: boolean;
    className?: string;
    avatarClassName?: string;
    showRemoveButton?: boolean;
}

export function PetAvatarEditor({
    imageUrl,
    onImageChange,
    onImageRemove,
    disabled = false,
    className,
    avatarClassName,
    showRemoveButton = true,
}: PetAvatarEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setOriginalImageSrc(url);
        setCropperOpen(true);
        e.target.value = ''; // Reset for re-selection
    };

    const handleCropComplete = (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
        onImageChange(file);
        setCropperOpen(false);
        setOriginalImageSrc(null); // Clean up
    };

    const handleCropCancel = () => {
        setCropperOpen(false);
        setOriginalImageSrc(null);
    };

    return (
        <div className={cn("relative group", className)}>
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary to-orange-400 rounded-full opacity-30 blur-xl group-hover:opacity-40 transition duration-1000 animate-pulse" />

            <Avatar className={cn("w-32 h-32 md:w-40 md:h-40 border-4 border-white/50 dark:border-white/10 shadow-2xl relative z-10", avatarClassName)}>
                <AvatarImage src={imageUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-white/50 dark:bg-black/20 text-4xl backdrop-blur-md">
                    <PawPrint className="w-16 h-16 text-primary/50" />
                </AvatarFallback>
            </Avatar>

            {!disabled && (
                <>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 hover:scale-110 transition-all z-20"
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                        disabled={disabled}
                    />

                    {imageUrl && showRemoveButton && (
                        <button
                            type="button"
                            onClick={onImageRemove}
                            disabled={disabled}
                            className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg hover:bg-destructive/90 hover:scale-110 transition-all z-20"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </>
            )}

            <ImageCropper
                open={cropperOpen}
                imageSrc={originalImageSrc}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
            />
        </div>
    );
}
