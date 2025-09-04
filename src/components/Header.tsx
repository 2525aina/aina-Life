// src/components/Header.tsx
// 汎用ヘッダーコンポーネント。
// ペット選択機能が必要な場合は、関連プロパティを渡すことで有効化される。

"use client";

import React from "react";
import Link from "next/link";
import { Pet } from "@/hooks/usePets";

// pets, selectedPet, onPetChange をオプショナルに変更
interface HeaderProps {
  pets?: Pet[];
  selectedPet?: Pet | null;
  onPetChange?: (pet: Pet) => void;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  pets,
  selectedPet,
  onPetChange,
  loading,
}) => {
  const handlePetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (pets && onPetChange) {
      const pet = pets.find((p) => p.id === e.target.value);
      if (pet) {
        onPetChange(pet);
      }
    }
  };

  // ローディング状態の表示
  if (loading) {
    return (
      <header className="w-full p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="h-7 w-24 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-6 w-6 bg-gray-700 rounded-full animate-pulse"></div>
        </div>
      </header>
    );
  }

  // 通常時のヘッダー表示
  return (
    <header className="w-full p-4 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        {pets && selectedPet && onPetChange ? (
          // ペット選択機能が有効な場合
          <select
            value={selectedPet.id}
            onChange={handlePetChange}
            className="text-lg font-bold bg-transparent border-none focus:ring-0 p-0 text-white"
          >
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id} className="bg-gray-800">
                {pet.name}
              </option>
            ))}
          </select>
        ) : (
          // ペット選択機能がない場合（デフォルト表示）
          <Link href="/" className="text-lg font-bold text-white">
            aina-Life
          </Link>
        )}

        <Link href="/settings" className="text-2xl text-white">
          ⚙️
        </Link>
      </div>
    </header>
  );
};
