"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePets } from "@/hooks/usePets";
import type { Pet } from "@/lib/types";
import { useUser } from "@/hooks/useUser";

interface PetSelectionContextType {
  selectedPetId: string | null;
  setSelectedPetId: (id: string | null) => void;
  selectedPet: Pet | null;
}

const PetSelectionContext = createContext<PetSelectionContextType | undefined>(
  undefined
);

export const PetSelectionProvider = ({ children }: { children: ReactNode }) => {
  const { pets, loading: loadingPets } = usePets();
  const { userProfile, loading: loadingUser } = useUser();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  useEffect(() => {
    if (loadingPets || loadingUser) return;

    if (selectedPetId === null && pets.length > 0) {
      if (userProfile?.primaryPetId) {
        const primaryPet = pets.find(
          (pet) => pet.id === userProfile.primaryPetId
        );
        if (primaryPet) {
          setSelectedPetId(primaryPet.id);
          return;
        }
      }
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId, loadingPets, userProfile, loadingUser]);

  const selectedPet = selectedPetId
    ? pets.find((pet) => pet.id === selectedPetId) || null
    : null;

  return (
    <PetSelectionContext.Provider
      value={{ selectedPetId, setSelectedPetId, selectedPet }}
    >
      {children}
    </PetSelectionContext.Provider>
  );
};

export const usePetSelection = () => {
  const context = useContext(PetSelectionContext);
  if (context === undefined) {
    throw new Error(
      "usePetSelection must be used within a PetSelectionProvider"
    );
  }
  return context;
};
