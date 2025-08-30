// src/components/ManualAddLogModal.tsx
// ユーザーが手動でログを追加するためのモーダルコンポーネント。
// 依存: useLogbook (タスク取得・ログ追加フック)

"use client";

import React, { useState, useEffect } from "react";
import { useLogbook } from "@/hooks/useLogbook";

interface ManualAddLogModalProps {
  isOpen: boolean; // モーダル表示状態
  onClose: () => void; // モーダルを閉じる処理
}

export const ManualAddLogModal: React.FC<ManualAddLogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tasks, addLog, loading: logbookLoading } = useLogbook(); // タスク一覧とログ追加関数を取得
  const [selectedTask, setSelectedTask] = useState<string>(""); // 選択中のタスクID
  const [logTime, setLogTime] = useState<string>(""); // 入力された時刻
  const [note, setNote] = useState<string>(""); // 任意メモ
  const [isAdding, setIsAdding] = useState(false); // ログ追加処理中フラグ

  // モーダル開閉時にフォーム初期化
  useEffect(() => {
    if (isOpen) {
      // 現在時刻をデフォルトセット
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setLogTime(`${hours}:${minutes}`);

      // タスクが存在すれば先頭を選択
      if (tasks.length > 0) {
        setSelectedTask(tasks[0].id);
      }
    }
  }, [isOpen, tasks]);

  // フォーム送信処理
  const handleSubmit = async () => {
    if (!selectedTask || !logTime) {
      alert("タスクと時刻を入力してください。"); // 必須項目チェック
      return;
    }

    setIsAdding(true);
    try {
      const task = tasks.find((t) => t.id === selectedTask);
      if (task) {
        await addLog(task, logTime, note); // 選択タスク・時刻・メモを渡して追加
        alert("ログを追加しました！");
        onClose(); // モーダルを閉じる
        // フォームリセット
        setNote("");
        setLogTime("");
        setSelectedTask("");
      }
    } catch (error) {
      console.error("ログの追加に失敗しました:", error);
      alert("ログの追加に失敗しました。");
    } finally {
      setIsAdding(false);
    }
  };

  // 非表示時は描画しない
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">手動でログを追加</h2>

        {/* 時刻入力 */}
        <div className="mb-4">
          <label
            htmlFor="logTime"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            時刻
          </label>
          <input
            type="time"
            id="logTime"
            value={logTime}
            onChange={(e) => setLogTime(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {/* タスク選択 */}
        <div className="mb-4">
          <label
            htmlFor="taskSelect"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            タスク
          </label>
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

        {/* メモ入力（任意） */}
        <div className="mb-6">
          <label
            htmlFor="note"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            メモ (任意)
          </label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="例: ご飯を完食しました"
          ></textarea>
        </div>

        {/* ボタン群 */}
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
            {isAdding ? "追加中..." : "ログを追加"}
          </button>
        </div>
      </div>
    </div>
  );
};
