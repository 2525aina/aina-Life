'use client';

import React, { useState, useEffect } from 'react';
import { useLogbook, Log, Task } from '@/hooks/useLogbook';
import { Timestamp, serverTimestamp } from 'firebase/firestore'; // serverTimestampを追加

interface EditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logToEdit: Log | null;
}

export const EditLogModal: React.FC<EditLogModalProps> = ({ isOpen, onClose, logToEdit }) => {
  const { tasks, updateLog, loading: logbookLoading } = useLogbook();
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [logTime, setLogTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && logToEdit) {
      // 編集対象のログデータでフォームを初期化
      setSelectedTask(logToEdit.taskId);
      const date = logToEdit.timestamp instanceof Timestamp ? logToEdit.timestamp.toDate() : new Date();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setLogTime(`${hours}:${minutes}`);
      setNote(logToEdit.note || '');
    } else if (isOpen && !logToEdit) {
      // 新規作成モードの場合（今回は編集専用だが、将来的な拡張性のため）
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setLogTime(`${hours}:${minutes}`);
      if (tasks.length > 0) {
        setSelectedTask(tasks[0].id);
      }
      setNote('');
    }
  }, [isOpen, logToEdit, tasks]);

  const handleSubmit = async () => {
    if (!logToEdit || !selectedTask || !logTime) {
      alert('タスクと時刻を入力してください。');
      return;
    }

    setIsUpdating(true);
    try {
      const task = tasks.find(t => t.id === selectedTask);
      if (task) {
        // 時刻をDateオブジェクトに変換
        const [hours, minutes] = logTime.split(':').map(Number);
        const updatedDate = new Date(logToEdit.timestamp instanceof Timestamp ? logToEdit.timestamp.toDate() : new Date());
        updatedDate.setHours(hours, minutes, 0, 0);

        // DateオブジェクトをFirestore Timestampに変換
        const firestoreTimestamp = Timestamp.fromDate(updatedDate); // 修正

        await updateLog(logToEdit.id, {
          taskName: task.name,
          taskId: task.id,
          timestamp: firestoreTimestamp, // Firestore Timestampを使用
          note: note,
          updatedAt: serverTimestamp(), // serverTimestampを使用
        });
        alert('ログを更新しました！');
        onClose();
      }
    } catch (error) {
      console.error('ログの更新に失敗しました:', error);
      alert('ログの更新に失敗しました。');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">ログを編集</h2>

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
            disabled={isUpdating}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isUpdating || logbookLoading}
          >
            {isUpdating ? '更新中...' : 'ログを更新'}
          </button>
        </div>
      </div>
    </div>
  );
};
