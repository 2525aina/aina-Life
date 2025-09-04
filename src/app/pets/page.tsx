// src/app/pets/page.tsx
// ペット管理ページコンポーネント。
// ペットの切り替え、プロフィール表示、追加、編集、削除を提供。
// 依存: usePets, PetFormModal, Header, FooterNav, PetSwitcherTabs, ProfileCard

"use client"; // クライアントサイドで実行

import React, { useState } from "react";
import { Header } from "@/components/Header"; // 共通ヘッダー
import { FooterNav } from "@/components/FooterNav"; // 共通フッターナビ
import { usePets, Pet } from "@/hooks/usePets"; // ペット管理フック
import { usePetSelection } from "@/contexts/PetSelectionContext"; // グローバルなペット選択状態
import { PetFormModal } from "@/components/PetFormModal"; // ペット追加/編集用モーダル
import { useAuth } from "@/hooks/useAuth"; // 認証状態フック
import LoginButton from "@/components/LoginButton"; // ログインボタン
import { PetSwitcherTabs } from "@/components/PetSwitcherTabs"; // ペット切り替えタブ
import { ProfileCard } from "@/components/ProfileCard"; // ペットプロフィールカード

export default function PetsPage() {
  const { deletePet } = usePets();
  const {
    pets,
    loading: petsLoading,
    selectedPet,
    setSelectedPet,
  } = usePetSelection();
  const { user, loading: authLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState<Pet | null>(null);

  const handleOpenAddModal = () => {
    setPetToEdit(null);
    setIsModalOpen(true);
  };

  // The pet passed to this function is the one to be edited.
  const handleOpenEditModal = (pet: Pet) => {
    setPetToEdit(pet);
    setIsModalOpen(true);
  };

  // The petId passed is for the pet to be deleted.
  const handleDeletePet = async (petId: string) => {
    if (window.confirm("本当にこのペットを削除しますか？")) {
      // If the deleted pet is the selected one, select another one.
      if (selectedPet && selectedPet.id === petId) {
        const newSelectedPet = pets.find((p) => p.id !== petId) || null;
        setSelectedPet(newSelectedPet);
      }
      await deletePet(petId);
    }
  };

  const loading = petsLoading || authLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-800 text-white">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-800">
        <h1 className="text-3xl font-bold mb-8">ログインが必要です</h1>
        <p className="mb-4">このページを表示するにはログインしてください。</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header
        pets={pets}
        selectedPet={selectedPet}
        onPetChange={setSelectedPet}
        loading={petsLoading}
      />
      
      <main className="flex-grow w-full p-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <PetSwitcherTabs
            pets={pets}
            selectedPet={selectedPet}
            onPetChange={setSelectedPet}
            onAddPet={handleOpenAddModal}
          />

          {petsLoading ? (
            <div className="text-center text-white mt-8">
              ペット情報を読み込み中...
            </div>
          ) : selectedPet ? (
            <ProfileCard
              pet={selectedPet}
              onEdit={() => handleOpenEditModal(selectedPet)}
              onDelete={() => handleDeletePet(selectedPet.id)}
            />
          ) : (
            <div className="text-center text-gray-400 mt-8 bg-gray-700 p-8 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-2">ペットを選択してください</h2>
              <p>上のタブからペットを選択するか、新しいペットを追加してください。</p>
            </div>
          )}
        </div>
      </main>
      
      <FooterNav />
      
      <PetFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        petToEdit={petToEdit}
      />
    </div>
  );
}
