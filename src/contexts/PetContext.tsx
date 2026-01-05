'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Pet } from '@/lib/types';
import { usePets } from '@/hooks/usePets';

interface PetContextType {
    selectedPet: Pet | null;
    setSelectedPet: (pet: Pet | null) => void;
    isPetLoading: boolean;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export function PetProvider({ children }: { children: ReactNode }) {
    const [selectedPet, setSelectedPetState] = useState<Pet | null>(null);
    const { pets, loading: petsLoading } = usePets();
    const [isInitialized, setIsInitialized] = useState(false);

    // Wrapper for setSelectedPet to handle persistence
    const setSelectedPet = (pet: Pet | null) => {
        setSelectedPetState(pet);
        if (pet) {
            localStorage.setItem('selectedPetId', pet.id);
        } else {
            localStorage.removeItem('selectedPetId');
        }
    };

    useEffect(() => {
        if (petsLoading) return;

        const storedPetId = localStorage.getItem('selectedPetId');

        if (selectedPet) {
            // Check if selected pet still exists
            const stillExists = pets.find(p => p.id === selectedPet.id);
            if (!stillExists) {
                // If current pet was deleted (or permission lost), fallback
                const fallback = pets.length > 0 ? pets[0] : null;
                setSelectedPet(fallback);
            } else {
                // Update pet data in case name/avatar changed
                if (JSON.stringify(stillExists) !== JSON.stringify(selectedPet)) {
                    setSelectedPetState(stillExists); // Don't trigger persistence write unnecessarily loop, but here it's fine
                }
            }
        } else {
            // No pet selected currently
            if (storedPetId) {
                const storedPet = pets.find(p => p.id === storedPetId);
                if (storedPet) {
                    setSelectedPet(storedPet);
                } else if (pets.length > 0) {
                    // Stored ID not found, default to first
                    setSelectedPet(pets[0]);
                }
            } else if (pets.length > 0) {
                // No stored ID, default to first
                setSelectedPet(pets[0]);
            }
        }
        setIsInitialized(true);
    }, [pets, petsLoading]);

    return (
        <PetContext.Provider value={{ selectedPet, setSelectedPet, isPetLoading: petsLoading || !isInitialized }}>
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
