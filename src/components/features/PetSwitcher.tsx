'use client';

import { usePets } from '@/hooks/usePets';
import { usePetContext } from '@/contexts/PetContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, Plus, PawPrint } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export function PetSwitcher() {
    const { pets, loading } = usePets();
    const { selectedPet, setSelectedPet } = usePetContext();

    useEffect(() => {
        if (!loading && pets.length > 0 && !selectedPet) {
            setSelectedPet(pets[0]);
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
                        <AvatarFallback className="bg-primary/10"><PawPrint className="w-4 h-4 text-primary" /></AvatarFallback>
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
                            <AvatarFallback className="bg-primary/10"><PawPrint className="w-4 h-4 text-primary" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{pet.name}</p>
                            {pet.breed && <p className="text-xs text-muted-foreground truncate">{pet.breed}</p>}
                        </div>
                    </DropdownMenuItem>
                ))}
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
