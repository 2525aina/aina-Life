'use client';

import React, { useState, useEffect } from 'react';
import { useLogbook } from '@/hooks/useLogbook';

interface ManualAddLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualAddLogModal: React.FC<ManualAddLogModalProps> = ({ isOpen, onClose }) => {
  const { tasks, addLog, loading: logbookLoading } = useLogbook();
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [logTime, setLogTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // モーダルが開いたときに現在時刻をセット
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setLogTime(`${hours}:${minutes}`);

      // タスクが読み込まれていれば最初のタスクをデフォルト選択
      if (tasks.length > 0) {
        setSelectedTask(tasks[0].id);
      }
    }
  }, [isOpen, tasks]);

  const handleSubmit = async () => {
    if (!selectedTask || !logTime) {
      alert('タスクと時刻を入力してください。');
      return;
    }

    setIsAdding(true);
    try {
      const task = tasks.find(t => t.id === selectedTask);
      if (task) {
        await addLog(task, logTime, note); // logTimeとnoteを渡す
        alert('ログを追加しました！');
        onClose(); // モーダルを閉じる
        // フォームをリセット
        setNote('');
        setLogTime('');
        setSelectedTask('');
      }
    } catch (error) {
      console.error('ログの追加に失敗しました:', error);
      alert('ログの追加に失敗しました。');
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">手動でログを追加</h2>

        <div className="mb-4">
          <label htmlFor="logTime" className="block text-gray-700 text-sm font-bold mb-2">時刻</label>
          <input
            type="time"
            id="logTime"
            value={logTime}
            onChange={(e) => setLogTime(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="taskSelect" className="block text-gray-700 text-sm font-bold mb-2">タスク</label>
          {logbookLoading ? (
            <p>タスク読み込み中...</p>
          ) : tasks.length > 0 ? (
            <select
              id="taskSelect"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          ) : (
            <p>タスクがありません。設定から追加してください。</p>
          )}
        </div>

        <div className="mb-6">
          <label htmlFor="note" className="block text-gray-700 text-sm font-bold mb-2">メモ (任意)</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="例: ご飯を完食しました"
          ></textarea>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isAdding}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isAdding || logbookLoading}
          >
            {isAdding ? '追加中...' : 'ログを追加'}
          </button>
        </div>
      </div>
    </div>
  );
};
