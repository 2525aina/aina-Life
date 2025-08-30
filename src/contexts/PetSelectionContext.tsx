// src/contexts/PetSelectionContext.tsx
// 選択中のペットの状態をグローバルに管理するためのContext。

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePets, Pet } from "@/hooks/usePets";

// Contextが提供する値の型定義
interface PetSelectionContextType {
  pets: Pet[];
  loading: boolean;
  selectedPet: Pet | null;
  setSelectedPet: (pet: Pet | null) => void;
}

// Contextの作成（初期値はundefined）
const PetSelectionContext = createContext<PetSelectionContextType | undefined>(
  undefined
);

// Contextを提供するためのProviderコンポーネント
export const PetSelectionProvider = ({ children }: { children: ReactNode }) => {
  const { pets, loading } = usePets(); // ペットリストを取得
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // ペットリストが読み込まれたら、選択中のペットを更新する
  useEffect(() => {
    if (pets.length > 0 && !selectedPet) {
      // まだ何も選択されていなければ、リストの先頭を選択
      setSelectedPet(pets[0]);
    } else if (pets.length > 0 && selectedPet) {
      // 選択中のペット情報が更新された場合（名前変更など）、最新の状態を反映
      const updatedSelectedPet = pets.find((p) => p.id === selectedPet.id);
      if (updatedSelectedPet) {
        setSelectedPet(updatedSelectedPet);
      } else {
        // 選択中のペットがリストから削除された場合、先頭のペットを選択
        setSelectedPet(pets[0]);
      }
    } else if (pets.length === 0) {
      // ペットが1匹もいなくなった場合
      setSelectedPet(null);
    }
  }, [pets, selectedPet]);

  const value = {
    pets,
    loading,
    selectedPet,
    setSelectedPet,
  };

  return (
    <PetSelectionContext.Provider value={value}>
      {children}
    </PetSelectionContext.Provider>
  );
};

// Contextを簡単に利用するためのカスタムフック
export const usePetSelection = () => {
  const context = useContext(PetSelectionContext);
  if (context === undefined) {
    throw new Error("usePetSelection must be used within a PetSelectionProvider");
  }
  return context;
};
