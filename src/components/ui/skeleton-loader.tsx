'use client';

import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
    variant?: 'card' | 'list-item' | 'avatar' | 'text' | 'image';
    count?: number;
    className?: string;
}

export function SkeletonLoader({
    variant = 'card',
    count = 1,
    className,
}: SkeletonLoaderProps) {
    const baseClasses = "bg-muted/20 animate-pulse";

    const variants = {
        card: "h-20 rounded-2xl",
        'list-item': "h-16 rounded-2xl",
        avatar: "w-12 h-12 rounded-full",
        text: "h-4 rounded-lg",
        image: "aspect-square rounded-2xl",
    };

    return (
        <div className={cn("space-y-3", className)}>
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className={cn(baseClasses, variants[variant])}
                />
            ))}
        </div>
    );
}

// プリセットコンポーネント
export function CardSkeleton({ count = 2 }: { count?: number }) {
    return <SkeletonLoader variant="card" count={count} />;
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
    return <SkeletonLoader variant="list-item" count={count} />;
}

export function GridSkeleton({ columns = 2, count = 4 }: { columns?: number; count?: number }) {
    return (
        <div className={cn("grid gap-3", columns === 2 ? "grid-cols-2" : "grid-cols-3")}>
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className="aspect-[4/5] bg-muted/20 animate-pulse rounded-2xl"
                />
            ))}
        </div>
    );
}
