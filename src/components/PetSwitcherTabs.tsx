// src/components/PetSwitcherTabs.tsx
// ペットを切り替えるためのタブコンポーネント
"use client";

import { Pet } from "@/hooks/usePets";

interface PetSwitcherTabsProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onPetChange: (pet: Pet) => void;
  onAddPet: () => void;
}

export const PetSwitcherTabs: React.FC<PetSwitcherTabsProps> = ({
  pets,
  selectedPet,
  onPetChange,
  onAddPet,
}) => {
  return (
    <div className="border-b border-gray-600">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        {pets.map((pet) => (
          <button
            key={pet.id}
            onClick={() => onPetChange(pet)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                selectedPet?.id === pet.id
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-400"
              }
            `}
          >
            {pet.name}
          </button>
        ))}
        <button
          onClick={onAddPet}
          className="whitespace-nowrap py-4 px-1 border-b-2 border-transparent text-gray-400 hover:text-gray-200 font-medium text-sm"
        >
          + 新しいペットを追加
        </button>
      </nav>
    </div>
  );
};
