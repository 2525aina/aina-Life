// src/components/WeightManagement.tsx
// 体重管理エリアのコンポーネント
"use client";

import { useState } from 'react';
import { Pet } from '@/hooks/usePets';
import { useWeightLog, WeightLog } from '@/hooks/useWeightLog';
import { WeightLogModal } from './WeightLogModal';

interface WeightManagementProps {
  pet: Pet;
}

export const WeightManagement: React.FC<WeightManagementProps> = ({ pet }) => {
  const { weights, loading, error } = useWeightLog(pet.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logToEdit, setLogToEdit] = useState<WeightLog | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const handleOpenAddModal = () => {
    setLogToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (log: WeightLog) => {
    setLogToEdit(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setLogToEdit(null);
  };

  return (
    <div className="mt-8 border-t border-gray-600 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">体重管理</h3>
        <button 
          onClick={handleOpenAddModal}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-md"
        >
          体重を記録する
        </button>
      </div>

      {loading && <p className="text-gray-400">体重履歴を読み込み中...</p>}
      {error && <p className="text-red-400">エラー: {error.message}</p>}
      
      {!loading && !error && (
        <div className="space-y-3 pr-4 max-h-48 overflow-y-auto">
          {weights.length > 0 ? (
            weights.map(log => (
              <div 
                key={log.id} 
                onClick={() => handleOpenEditModal(log)}
                className="bg-gray-800 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-900 transition-colors"
              >
                <p className="text-gray-300">{formatDate(log.date)}</p>
                <p className="font-semibold text-lg">{log.value} {log.unit}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-4">まだ体重の記録がありません。</p>
          )}
        </div>
      )}

      <WeightLogModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        petId={pet.id}
        logToEdit={logToEdit}
      />
    </div>
  );
};
