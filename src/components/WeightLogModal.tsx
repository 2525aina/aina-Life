// src/components/WeightLogModal.tsx
// 体重記録用のモーダルコンポーネント (追加・編集・削除対応)
"use client";

import { useState, useEffect } from 'react';
import { useWeightLog, WeightLog } from '@/hooks/useWeightLog';

interface WeightLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  logToEdit?: WeightLog | null;
}

export const WeightLogModal: React.FC<WeightLogModalProps> = ({ isOpen, onClose, petId, logToEdit }) => {
  const { addWeight, updateWeight, deleteWeight } = useWeightLog(petId);
  const [weightValue, setWeightValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!logToEdit;

  useEffect(() => {
    if (isEditMode) {
      setWeightValue(String(logToEdit.value));
      setDateValue(logToEdit.date.toISOString().split('T')[0]);
    } else {
      // Reset for add mode
      setWeightValue('');
      setDateValue(new Date().toISOString().split('T')[0]);
    }
  }, [logToEdit, isOpen]); // Depend on isOpen to reset form when re-opened for adding

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(weightValue);
    if (isNaN(value) || value <= 0) {
      setError('有効な体重を入力してください。');
      return;
    }
    if (!dateValue) {
      setError('日付を選択してください。');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (isEditMode) {
        await updateWeight(logToEdit.id, value, new Date(dateValue));
      } else {
        await addWeight(value, new Date(dateValue));
      }
      onClose();
    } catch (err) {
      setError('保存に失敗しました。もう一度お試しください。');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;

    if (window.confirm('この体重記録を本当に削除しますか？')) {
      setIsSubmitting(true);
      try {
        await deleteWeight(logToEdit.id);
        onClose();
      } catch (err) {
        setError('削除に失敗しました。');
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-700 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">
          {isEditMode ? '記録を編集' : '体重を記録'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="weight-date" className="block text-sm font-medium text-gray-300 mb-1">日付</label>
            <input 
              id="weight-date"
              type="date" 
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="weight-value" className="block text-sm font-medium text-gray-300 mb-1">体重 (kg)</label>
            <input 
              id="weight-value"
              type="number"
              step="0.01"
              placeholder="例: 5.2"
              value={weightValue}
              onChange={(e) => setWeightValue(e.target.value)}
              className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-600"
            />
          </div>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <div className="flex justify-between items-center">
            {isEditMode ? (
              <button type="button" onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:bg-red-900">
                削除
              </button>
            ) : (
              <div></div> // Placeholder for alignment
            )}
            <div className="flex space-x-4">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-white bg-gray-600 hover:bg-gray-500">
                キャンセル
              </button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-md text-white bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800">
                {isSubmitting ? '保存中...' : (isEditMode ? '更新' : '保存')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
