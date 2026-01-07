'use client';

import { usePets } from '@/hooks/usePets';
import { usePetContext } from '@/contexts/PetContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export function PetSwitcher() {
    const { pets, loading } = usePets();
    const { selectedPet, setSelectedPet } = usePetContext();

    useEffect(() => {
        if (loading) return;

        if (pets.length > 0) {
            if (selectedPet) {
                // 選択中のペットが最新のリストに存在するか確認し、データが更新されていればStateも更新
                const updatedPet = pets.find(p => p.id === selectedPet.id);
                if (updatedPet) {
                    // JSON.stringifyで比較して変更があれば更新 (レンダリングループ防止)
                    if (JSON.stringify(updatedPet) !== JSON.stringify(selectedPet)) {
                        setSelectedPet(updatedPet);
                    }
                } else {
                    // 選択中のペットが削除された場合は最初のペットを選択
                    setSelectedPet(pets[0]);
                }
            } else {
                // 未選択の場合は最初のペットを選択
                setSelectedPet(pets[0]);
            }
        } else {
            // ペットが1匹もいない場合は選択解除
            if (selectedPet) {
                setSelectedPet(null);
            }
        }
    }, [pets, loading, selectedPet, setSelectedPet]);

    if (loading) return <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />;

    if (pets.length === 0) {
        return (
            <Link href="/pets/new">
                <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />ペットを登録
                </Button>
            </Link>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 h-10 px-3">
                    <Avatar className="w-7 h-7">
                        <AvatarImage src={selectedPet?.avatarUrl} alt={selectedPet?.name} />
                        <AvatarFallback className="bg-primary/10 flex items-center justify-center overflow-hidden">
                            <img src="/ogp.webp" alt="Pet" className="w-full h-full object-cover opacity-50 grayscale" />
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium max-w-[100px] truncate">{selectedPet?.name || 'ペットを選択'}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {pets.map((pet) => (
                    <DropdownMenuItem key={pet.id} onClick={() => setSelectedPet(pet)} className="gap-3 cursor-pointer">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={pet.avatarUrl} alt={pet.name} />
                            <AvatarFallback className="bg-primary/10 flex items-center justify-center overflow-hidden">
                                <img src="/ogp.webp" alt="Pet" className="w-full h-full object-cover opacity-50 grayscale" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{pet.name}</p>
                            {pet.breed && <p className="text-xs text-muted-foreground truncate">{pet.breed}</p>}
                        </div>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {selectedPet && (
                    <DropdownMenuItem asChild>
                        <Link href={`/pets/settings?id=${selectedPet.id}`} className="gap-3 cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Settings className="w-4 h-4" /></div>
                            <span>{selectedPet.name}の設定</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link href="/pets/new" className="gap-3 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Plus className="w-4 h-4" /></div>
                        <span>新しいペットを追加</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
