'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { usePets, Pet } from '@/hooks/usePets';
import { PetFormModal } from '@/components/PetFormModal';

export default function PetsPage() {
  const { pets, loading, deletePet } = usePets();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState<Pet | null>(null);

  const handleOpenAddModal = () => {
    setPetToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pet: Pet) => {
    setPetToEdit(pet);
    setIsModalOpen(true);
  };

  const handleDeletePet = async (petId: string) => {
    await deletePet(petId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header />
      <main className="flex-grow w-full p-4 pb-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">ペット管理</h1>
          <button
            onClick={handleOpenAddModal}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
          >
            + 新しいペットを追加
          </button>
        </div>

        {loading ? (
          <div className="text-center text-white">ペット情報を読み込み中...</div>
        ) : (
          <div className="space-y-4">
            {pets.length > 0 ? (
              pets.map((pet) => (
                <div key={pet.id} className="bg-gray-700 p-4 rounded-lg shadow-md flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">{pet.name}</h2>
                    <p className="text-sm text-gray-400">{pet.breed || '犬種未設定'}</p>
                    <p className="text-sm text-gray-400">{pet.birthday || '誕生日未設定'}</p>
                  </div>
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
              <p className="text-center text-gray-400">まだペットが登録されていません。</p>
            )}
          </div>
        )}
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