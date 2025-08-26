'use client';

import React, { useState, useEffect } from 'react';
import { useLogbook, Task } from '@/hooks/useLogbook';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null; // 編集対象のタスク (新規作成時はnull)
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, taskToEdit }) => {
  const { addTask, updateTask, loading: logbookLoading } = useLogbook();
  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>('#000000'); // デフォルト色
  const [textColor, setTextColor] = useState<string>('#FFFFFF'); // ★追加: 文字色用のstate
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        // 編集モード: 既存のタスクデータでフォームを初期化
        setName(taskToEdit.name);
        setColor(taskToEdit.color);
        setTextColor(taskToEdit.textColor || '#FFFFFF'); // ★追加: textColorの初期化
      } else {
        // 新規作成モード: フォームをリセット
        setName('');
        setColor('#000000');
        setTextColor('#FFFFFF'); // ★追加: textColorのリセット
      }
    }
  }, [isOpen, taskToEdit]);

  const handleSubmit = async () => {
    if (!name || !color) { // textColorはオプションなので必須チェックから除外
      alert('タスク名と色を入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        // 編集
        await updateTask(taskToEdit.id, { name, color, textColor }); // ★修正: textColorを渡す
        alert('タスクを更新しました！');
      } else {
        // 新規作成
        const newOrder = 0; // 仮の値
        await addTask({ name, color, textColor, order: newOrder }); // ★修正: textColorを渡す
        alert('タスクを追加しました！');
      }
      onClose(); // モーダルを閉じる
    } catch (error) {
      console.error('タスクの保存に失敗しました:', error);
      alert('タスクの保存に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">{taskToEdit ? 'タスクを編集' : '新しいタスクを追加'}</h2>

        <div className="mb-4">
          <label htmlFor="taskName" className="block text-gray-700 text-sm font-bold mb-2">タスク名</label>
          <input
            type="text"
            id="taskName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="例: ご飯"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="taskColor" className="block text-gray-700 text-sm font-bold mb-2">背景色 (HEXコード)</label> {/* ★修正: ラベルを背景色に */}
          <input
            type="color"
            id="taskColor"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 h-10 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="ml-2 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-24"
            placeholder="#RRGGBB"
          />
        </div>

        {/* ★追加: 文字色入力フィールド */}
        <div className="mb-6">
          <label htmlFor="taskTextColor" className="block text-gray-700 text-sm font-bold mb-2">文字色 (HEXコード)</label>
          <input
            type="color"
            id="taskTextColor"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 h-10 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="ml-2 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-24"
            placeholder="#RRGGBB"
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
            disabled={isSubmitting || logbookLoading}
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
