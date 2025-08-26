'use client';

import React, { useState, useEffect } from 'react';
import { usePets, Pet } from '@/hooks/usePets';

interface PetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  petToEdit?: Pet | null;
}

export const PetFormModal: React.FC<PetFormModalProps> = ({ isOpen, onClose, petToEdit }) => {
  const { addPet, updatePet } = usePets();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (petToEdit) {
        setName(petToEdit.name);
        setBreed(petToEdit.breed);
        setBirthday(petToEdit.birthday);
      } else {
        setName('');
        setBreed('');
        setBirthday('');
      }
    }
  }, [isOpen, petToEdit]);

  const handleSubmit = async () => {
    if (!name) {
      alert('ペットの名前を入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      const petData = { name, breed, birthday };
      if (petToEdit) {
        await updatePet(petToEdit.id, petData);
        alert('ペット情報を更新しました！');
      } else {
        await addPet(petData);
        alert('ペットを追加しました！');
      }
      onClose();
    } catch (error) {
      console.error('ペット情報の保存に失敗しました:', error);
      alert('ペット情報の保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">{petToEdit ? 'ペット情報を編集' : '新しいペットを追加'}</h2>

        <div className="mb-4">
          <label htmlFor="petName" className="block text-gray-700 text-sm font-bold mb-2">名前</label>
          <input
            type="text"
            id="petName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="ポチ"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="petBreed" className="block text-gray-700 text-sm font-bold mb-2">犬種 (任意)</label>
          <input
            type="text"
            id="petBreed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="柴犬"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="petBirthday" className="block text-gray-700 text-sm font-bold mb-2">誕生日 (任意)</label>
          <input
            type="date"
            id="petBirthday"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
