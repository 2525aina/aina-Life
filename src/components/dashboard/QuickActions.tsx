'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { usePetContext } from '@/contexts/PetContext';
import { ENTRY_TAGS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function QuickActions() {
    const { selectedPet } = usePetContext();
    const { tasks } = useCustomTasks(selectedPet?.id || null);
    const router = useRouter();

    // Use top 4 tasks or specific defaults if no tasks
    const displayTasks = tasks.length > 0
        ? tasks.slice(0, 4)
        : ENTRY_TAGS.slice(0, 4).map(t => ({ name: t.label, emoji: t.emoji }));

    const handleQuickAction = (taskName: string) => {
        // Navigate to entry creation with pre-selected tag
        // Note: EntryForm needs to handle `tag` search param if we implement that.
        // For now, just go to new entry. 
        // Ideally: router.push(`/entry/new?tag=${encodeURIComponent(taskName)}`);
        // But let's check if EntryForm supports it. It might not yet.
        // So for now, just open new entry.
        router.push('/entry/new');
    };

    return (
        <div className="grid grid-cols-4 gap-3">
            {displayTasks.map((task, index) => (
                <motion.button
                    key={task.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index + 0.3 }}
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickAction(task.name)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-sm hover:shadow-md transition-all gap-1.5"
                >
                    <span className="text-2xl drop-shadow-sm">{task.emoji}</span>
                    <span className="text-[10px] font-medium text-foreground/80 truncate w-full text-center">{task.name}</span>
                </motion.button>
            ))}

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Link href="/entry/new" className="h-full">
                    <Button
                        variant="outline"
                        className="w-full h-full flex flex-col items-center justify-center p-3 rounded-2xl border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 gap-1"
                    >
                        <Plus className="w-5 h-5 text-primary" />
                        <span className="text-[10px] font-medium text-primary">その他</span>
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}
