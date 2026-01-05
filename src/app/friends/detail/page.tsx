'use client';

import { AppLayout } from '@/components/features/AppLayout';
import { usePetContext } from '@/contexts/PetContext';
import { useMembers } from '@/hooks/useMembers';
import { useFriend } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Calendar, Trash2, Edit, Scale, Cake, User, Phone, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, differenceInYears } from 'date-fns';
import { ja } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useFriends } from '@/hooks/useFriends';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function FriendDetailContent() {
    const { selectedPet } = usePetContext();
    const { canEdit } = useMembers(selectedPet?.id || null);
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { friend, loading } = useFriend(selectedPet?.id || null, id || '');
    const { deleteFriend } = useFriends(selectedPet?.id || null);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('このお友達を削除しましたか？')) return;
        if (!id) return;
        try {
            await deleteFriend(id);
            toast.success('削除しました');
            router.push('/friends');
        } catch (e) {
            console.error(e);
            toast.error('削除できませんでした');
        }
    };

    if (!id) return <div className="p-8 text-center">IDが指定されていません</div>;
    if (loading) return <div className="p-8 text-center">読み込み中...</div>;
    if (!friend) return <div className="p-8 text-center">お友達が見つかりません</div>;

    const age = friend.birthday ? differenceInYears(new Date(), friend.birthday.toDate()) : null;

    return (
        <div className="relative min-h-screen pb-32">
            {/* Hero Image / Header */}
            <div className="relative aspect-square w-full bg-muted overflow-hidden rounded-b-[3rem]">
                {friend.images?.[0] ? (
                    <img
                        src={friend.images[0]}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <img src="/ogp.webp" alt="No image" className="w-32 h-32 object-contain opacity-20 grayscale" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                <div className="absolute top-6 left-4 z-10 flex items-center gap-2">
                    <Link href="/friends">
                        <Button variant="ghost" size="icon" className="rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                </div>

                {canEdit && (
                    <div className="absolute top-6 right-4 z-10">
                        <Link href={`/friends/edit?id=${id}`}>
                            <Button variant="ghost" size="icon" className="rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md">
                                <Edit className="w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-6 left-6 right-6 text-white"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/10">
                            {friend.breed || '犬種不明'}
                        </span>
                        {friend.gender !== 'unknown' && (
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${friend.gender === 'male' ? 'bg-blue-500/80' : 'bg-red-500/80'}`}>
                                {friend.gender === 'male' ? '♂' : '♀'}
                            </span>
                        )}
                        {age !== null && (
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/10">
                                {age}歳
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-1">{friend.name}</h1>
                    <p className="text-white/70 text-sm font-medium">
                        {friend.color && `${friend.color} • `}
                        {friend.ownerName ? `${friend.ownerName}さんのペット` : '飼い主不明'}
                    </p>
                </motion.div>
            </div>

            {/* Details Content */}
            <div className="px-4 py-6 space-y-6">
                {/* Basic Stats */}
                <div className="grid grid-cols-2 gap-3">
                    {friend.weight && (
                        <div className="glass p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <Scale className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold">体重</p>
                                <p className="font-bold">{friend.weight}{friend.weightUnit}</p>
                            </div>
                        </div>
                    )}
                    {friend.birthday && (
                        <div className="glass p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-600">
                                <Cake className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold">誕生日</p>
                                <p className="font-bold">{format(friend.birthday.toDate(), 'yyyy/M/d')}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Info Card */}
                <div className="glass rounded-[2rem] p-6 shadow-xl border-white/20 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-bold">出会った日</p>
                            <p className="font-bold">{format(friend.metAt.toDate(), 'yyyy年M月d日 (E)', { locale: ja })}</p>
                        </div>
                    </div>

                    {friend.location && (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold">出会った場所</p>
                                <p className="font-bold">{friend.location}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Owner Info (if exists) */}
                {(friend.ownerName || friend.ownerDetails || friend.contact || friend.address) && (
                    <div className="space-y-2 px-2">
                        <h3 className="font-bold text-lg text-muted-foreground flex items-center gap-2">
                            <User className="w-4 h-4" /> 飼い主情報
                        </h3>
                        <div className="glass rounded-2xl p-5 text-sm leading-relaxed border-white/20 space-y-3">
                            {friend.ownerName && (
                                <div className="flex items-start gap-3">
                                    <span className="font-bold min-w-16">お名前</span>
                                    <span>{friend.ownerName}</span>
                                </div>
                            )}
                            {friend.ownerDetails && (
                                <div className="flex items-start gap-3">
                                    <span className="font-bold min-w-16">特徴</span>
                                    <span>{friend.ownerDetails}</span>
                                </div>
                            )}
                            {friend.contact && (
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <span>{friend.contact}</span>
                                </div>
                            )}
                            {friend.address && (
                                <div className="flex items-start gap-3">
                                    <Home className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    <span>{friend.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Memo / Features */}
                {friend.features && (
                    <div className="space-y-2 px-2">
                        <h3 className="font-bold text-lg text-muted-foreground">メモ・特徴</h3>
                        <div className="glass rounded-2xl p-5 text-sm leading-relaxed border-white/20 whitespace-pre-wrap">
                            {friend.features}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {canEdit && (
                    <div className="flex gap-4 pt-4">
                        <Button
                            variant="destructive"
                            className="w-full h-12 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-none border-0"
                            onClick={handleDelete}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            友達を削除
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function FriendDetailPage() {
    return (
        <AppLayout>
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }>
                <FriendDetailContent />
            </Suspense>
        </AppLayout>
    );
}
