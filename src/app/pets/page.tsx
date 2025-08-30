// src/app/pets/page.tsx
// ペット管理ページコンポーネント。
// ペットの一覧表示、追加、編集、削除を提供。
// 依存: usePets, PetFormModal, Header, FooterNav

"use client"; // クライアントサイドで実行

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header"; // 共通ヘッダー
import { FooterNav } from "@/components/FooterNav"; // 共通フッターナビ
import { usePets, Pet } from "@/hooks/usePets"; // ペット管理フック
import { usePetSelection } from "@/contexts/PetSelectionContext"; // グローバルなペット選択状態
import { PetFormModal } from "@/components/PetFormModal"; // ペット追加/編集用モーダル

export default function PetsPage() {
  // usePetsフックからペット情報とローディング状態、削除関数を取得
  const { deletePet } = usePets(); // Only need deletePet from here
  const { pets, loading, selectedPet, setSelectedPet } = usePetSelection(); // Get pets, loading, and selectedPet from context
  const [isModalOpen, setIsModalOpen] = useState(false); // モーダル開閉状態
  const [petToEdit, setPetToEdit] = useState<Pet | null>(null); // 編集対象ペット

  // 新規ペット追加用モーダルを開く
  const handleOpenAddModal = () => {
    setPetToEdit(null); // 新規追加なので編集対象なし
    setIsModalOpen(true);
  };

  // ペット編集用モーダルを開く
  const handleOpenEditModal = (pet: Pet) => {
    setPetToEdit(pet); // 編集対象をセット
    setIsModalOpen(true);
  };

  // ペット削除処理
  const handleDeletePet = async (petId: string) => {
    // 削除後に選択中のペットを更新する必要がある場合
    if (selectedPet && selectedPet.id === petId) {
      const newSelectedPet = pets.find((p) => p.id !== petId);
      setSelectedPet(newSelectedPet || null);
    }
    await deletePet(petId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header
        pets={pets}
        selectedPet={selectedPet}
        onPetChange={setSelectedPet}
        loading={loading}
      />
      <main className="flex-grow w-full p-4 pb-16">
        {/* ページタイトルと追加ボタン */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">ペット管理</h1>
          <button
            onClick={handleOpenAddModal}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
          >
            + 新しいペットを追加
          </button>
        </div>

        {/* ペット一覧表示またはローディング表示 */}
        {loading ? (
          <div className="text-center text-white">
            ペット情報を読み込み中...
          </div>
        ) : (
          <div className="space-y-4">
            {pets.length > 0 ? (
              pets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-gray-700 p-4 rounded-lg shadow-md flex justify-between items-center"
                >
                  {/* ペット情報表示 */}
                  <div>
                    <h2 className="text-xl font-bold text-white">{pet.name}</h2>
                    <p className="text-sm text-gray-400">
                      {pet.breed || "犬種未設定"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {pet.birthday || "誕生日未設定"}
                    </p>
                  </div>
                  {/* 編集・削除ボタン */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(pet)}
                      className="text-blue-300 hover:text-blue-100 text-sm"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeletePet(pet.id)}
                      className="text-red-300 hover:text-red-100 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400">
                まだペットが登録されていません。
              </p>
            )}
          </div>
        )}
      </main>
      <FooterNav /> {/* 共通フッターナビ */}
      {/* ペット追加・編集モーダル */}
      <PetFormModal
        isOpen={isModalOpen} // モーダル開閉状態
        onClose={() => setIsModalOpen(false)} // 閉じる処理
        petToEdit={petToEdit} // 編集対象ペット
      />
    </div>
  );
}
