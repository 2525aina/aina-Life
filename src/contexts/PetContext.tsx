'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Pet } from '@/lib/types';

interface PetContextType {
    selectedPet: Pet | null;
    setSelectedPet: (pet: Pet | null) => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export function PetProvider({ children }: { children: ReactNode }) {
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

    return (
        <PetContext.Provider value={{ selectedPet, setSelectedPet }}>
            {children}
        </PetContext.Provider>
    );
}

export function usePetContext() {
    const context = useContext(PetContext);
    if (context === undefined) {
        throw new Error('usePetContext must be used within a PetProvider');
    }
    return context;
}
