// src/components/Header.tsx
// 選択中のペットを切り替え可能なヘッダーコンポーネント。
// 依存: usePets (ペット情報管理フック)

"use client";

import React from "react";
import { usePets } from "@/hooks/usePets";

export const Header = () => {
  // usePetsフックからペットリスト、選択中ID、選択関数、ローディング状態を取得
  const { pets, selectedPetId, selectPet, loading } = usePets();

  // セレクトボックス変更時のハンドラ
  const handlePetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    selectPet(e.target.value); // 選択されたペットIDで切替
  };

  // ローディング中はスケルトン表示でUIのガタつきを抑える
  if (loading) {
    return (
      <header className="w-full p-4 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          {/* ペット名表示のスケルトン */}
          <div className="h-7 w-24 bg-gray-200 rounded animate-pulse"></div>
          {/* 設定アイコン部分のスケルトン */}
          <div className="h-6 w-6 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </header>
    );
  }

  // ロード完了後のヘッダー表示
  return (
    <header className="w-full p-4 bg-white border-b border-gray-400 sticky top-0 z-10">
      <div className="max-w-lg mx-auto flex justify-between items-center">
        {pets.length > 0 && selectedPetId ? (
          // ペット選択用セレクトボックス
          <select
            value={selectedPetId}
            onChange={handlePetChange}
            className="text-lg font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-400"
          >
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} {/* ペット名を表示 */}
              </option>
            ))}
          </select>
        ) : (
          // ペット未登録時のメッセージ
          <div className="text-lg font-bold">ペットを登録してください</div>
        )}

        {/* TODO: 設定アイコンを後ほど実装 */}
        <div>⚙️</div>
      </div>
    </header>
  );
};
