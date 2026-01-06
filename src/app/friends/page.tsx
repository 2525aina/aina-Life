'use client';

import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useMembers } from '@/hooks/useMembers';
import { useFriends } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Timestamp } from 'firebase/firestore';

// キャッシュから復元されたTimestampを安全にDateに変換
function toDate(ts: Timestamp | { seconds: number; nanoseconds: number } | undefined): Date | null {
    if (!ts) return null;
    if (ts instanceof Timestamp) return ts.toDate();
    if (typeof ts === 'object' && 'seconds' in ts) {
        return new Date(ts.seconds * 1000);
    }
    return null;
}

export default function FriendsPage() {
    const { selectedPet } = usePetContext();
    const { canEdit } = useMembers(selectedPet?.id || null);
    const { friends, loading } = useFriends(selectedPet?.id || null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="relative min-h-screen pb-32">
                {/* Global Header Gradient */}
                <div className="absolute inset-0 h-[30vh] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent -z-10 rounded-b-[3rem]" />

                <div className="px-4 pt-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                <span className="text-3xl">🐾</span>
                                お散歩友達
                            </h1>
                            <p className="text-xs font-bold text-muted-foreground ml-1">
                                {selectedPet?.name}の友達リスト
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="名前、犬種、飼い主名で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-white/50 backdrop-blur-sm border-white/20 shadow-sm rounded-xl focus:bg-white transition-all"
                        />
                    </div>

                    {/* Friends Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="aspect-[4/5] bg-muted/20 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredFriends.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-3xl glass border-dashed">
                            <p className="text-muted-foreground text-sm mb-4">まだ友達がいません</p>
                            {canEdit && (
                                <Link href="/friends/new">
                                    <Button className="rounded-full gradient-primary font-bold shadow-lg">
                                        <Plus className="w-4 h-4 mr-2" />
                                        最初の友達を登録
                                    </Button>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {filteredFriends.map((friend, index) => (
                                <Link key={friend.id} href={`/friends/detail?id=${friend.id}`}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative aspect-[4/5] rounded-2xl overflow-hidden glass border-white/20 shadow-sm hover:shadow-xl transition-all duration-300"
                                    >
                                        {/* Image */}
                                        <div className="absolute inset-0 bg-muted">
                                            {friend.images?.[0] ? (
                                                <Image
                                                    src={friend.images[0]}
                                                    alt={friend.name}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                                                    <Image src="/ogp.webp" alt="No image" width={64} height={64} className="opacity-20 grayscale" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                                        {/* Content */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                                            <p className="text-[10px] font-medium text-white/70 mb-0.5 flex items-center gap-1">
                                                {friend.breed || '犬種不明'}
                                                {friend.gender === 'male' && <span className="text-blue-300">♂</span>}
                                                {friend.gender === 'female' && <span className="text-red-300">♀</span>}
                                            </p>
                                            <h3 className="font-bold text-lg leading-tight mb-1 truncate">
                                                {friend.name}
                                            </h3>

                                            <div className="flex items-center gap-2 mt-2 text-[10px] font-medium text-white/60">
                                                {toDate(friend.metAt) && (
                                                    <span className="flex items-center gap-0.5 bg-black/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(toDate(friend.metAt)!, 'M/d')}
                                                    </span>
                                                )}
                                                {friend.location && (
                                                    <span className="flex items-center gap-0.5 bg-black/20 px-1.5 py-0.5 rounded-full backdrop-blur-sm truncate max-w-[80px]">
                                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{friend.location}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* FAB - sticky above footer */}
                {canEdit && (
                    <div className="sticky bottom-24 z-20 flex justify-end px-4 pt-6">
                        <Link href="/friends/new">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-14 h-14 rounded-full gradient-primary shadow-xl shadow-primary/30 flex items-center justify-center text-white"
                            >
                                <Plus className="w-7 h-7" />
                            </motion.button>
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
