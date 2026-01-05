'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PawPrint, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePetContext } from '@/contexts/PetContext';

export function HeroSection() {
    const { selectedPet } = usePetContext();
    const now = new Date();
    const hour = now.getHours();

    let greeting = 'こんにちは';
    if (hour < 5) greeting = 'こんばんは';
    else if (hour < 11) greeting = 'おはよう';
    else if (hour < 18) greeting = 'こんにちは';
    else greeting = 'こんばんは';

    if (!selectedPet) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground p-6 shadow-xl"
        >
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black/5 rounded-full blur-2xl opacity-30 pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col"
                    >
                        <span className="text-sm font-medium opacity-90 mb-1">
                            {format(now, 'M月d日 EEEE', { locale: ja })}
                        </span>
                        <h1 className="text-3xl font-bold tracking-tight mb-2">
                            {greeting},<br />
                            <span className="text-4xl">{selectedPet.name}</span>
                        </h1>
                    </motion.div>
                </div>

                <Link href={`/pets/settings?id=${selectedPet.id}`}>
                    <Button variant="ghost" size="icon" className="text-primary-foreground/80 hover:text-white hover:bg-white/20 rounded-full">
                        <Settings className="w-5 h-5" />
                    </Button>
                </Link>
            </div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="mt-6 flex justify-center"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-white/30 blur-xl rounded-full scale-110" />
                    <Avatar className="w-24 h-24 border-4 border-white/20 shadow-2xl relative z-10">
                        <AvatarImage src={selectedPet.avatarUrl} alt={selectedPet.name} className="object-cover" />
                        <AvatarFallback className="bg-white/20 text-white text-2xl">
                            <PawPrint className="w-10 h-10" />
                        </AvatarFallback>
                    </Avatar>
                    {/* Status Indicator (Mockup for now) */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-400 border-4 border-primary rounded-full z-20 shadow-lg" />
                </div>
            </motion.div>
        </motion.div>
    );
}
