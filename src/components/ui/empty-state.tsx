'use client';

import { PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "text-center py-10 px-6 rounded-3xl glass border-dashed border-white/20",
                className
            )}
        >
            <div className="flex justify-center mb-4">
                {icon || (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <PawPrint className="w-6 h-6 text-primary/50" />
                    </div>
                )}
            </div>
            <p className="text-muted-foreground font-medium mb-2">{title}</p>
            {description && (
                <p className="text-sm text-muted-foreground/70 mb-4">{description}</p>
            )}
            {action && (
                action.href ? (
                    <Link href={action.href}>
                        <Button className="rounded-full gradient-primary font-bold shadow-lg">
                            {action.label}
                        </Button>
                    </Link>
                ) : (
                    <Button
                        className="rounded-full gradient-primary font-bold shadow-lg"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </Button>
                )
            )}
        </motion.div>
    );
}
