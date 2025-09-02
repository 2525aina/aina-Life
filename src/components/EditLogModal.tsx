// src/components/EditLogModal.tsx
// ログ編集用モーダルコンポーネント。
// 依存: useLogbook, firebase/firestore(Timestamp, serverTimestamp), react-hot-toast

"use client";

import React, { useState, useEffect } from "react";
import { useLogbook, Log } from "@/hooks/useLogbook";
import { Pet } from "@/hooks/usePets";
import { Timestamp, serverTimestamp } from "firebase/firestore";
import { toast } from "react-hot-toast";

interface EditLogModalProps {
  isOpen: boolean; // モーダルの開閉状態
  onClose: () => void; // モーダルを閉じるハンドラ
  logToEdit: Log | null; // 編集対象のログ
  selectedPet: Pet | null;
}

export const EditLogModal: React.FC<EditLogModalProps> = ({
  isOpen,
  onClose,
  logToEdit,
  selectedPet,
}) => {
  const { tasks, updateLog, loading: logbookLoading } = useLogbook(
    selectedPet?.id
  );
  const [selectedTask, setSelectedTask] = useState<string>(""); // 選択中のタスクID
  const [logTime, setLogTime] = useState<string>(""); // 入力中の時刻文字列(HH:mm)
  const [note, setNote] = useState<string>(""); // 入力中のメモ
  const [isUpdating, setIsUpdating] = useState(false); // 更新処理中フラグ

  useEffect(() => {
    if (isOpen && logToEdit) {
      // 編集対象のログでフォーム初期化
      setSelectedTask(logToEdit.taskId);
      const date =
        logToEdit.timestamp instanceof Timestamp
          ? logToEdit.timestamp.toDate()
          : new Date();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      setLogTime(`${hours}:${minutes}`);
      setNote(logToEdit.note || "");
    } else if (isOpen && !logToEdit) {
      // 新規作成モード用の初期値設定（将来拡張用）
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      setLogTime(`${hours}:${minutes}`);
      if (tasks.length > 0) setSelectedTask(tasks[0].id);
      setNote("");
    }
  }, [isOpen, logToEdit, tasks]);

  const handleSubmit = async () => {
    if (!logToEdit || !selectedTask || !logTime) {
      alert("タスクと時刻を入力してください。");
      return;
    }

    setIsUpdating(true); // 更新処理開始フラグをセット
    try {
      const task = tasks.find((t) => t.id === selectedTask);
      if (task) {
        // 入力時刻(HH:mm)をDateに変換
        const [hours, minutes] = logTime.split(":").map(Number);
        const updatedDate = new Date(
          logToEdit.timestamp instanceof Timestamp
            ? logToEdit.timestamp.toDate()
            : new Date()
        );
        updatedDate.setHours(hours, minutes, 0, 0);

        // Firestore用Timestampに変換
        const firestoreTimestamp = Timestamp.fromDate(updatedDate);

        // ログ更新処理
        await updateLog(logToEdit.id, {
          taskName: task.name,
          taskId: task.id,
          timestamp: firestoreTimestamp,
          note: note,
        });

        toast.success("ログを更新しました！");
        onClose(); // モーダルを閉じる
      }
    } catch (error) {
      console.error("ログの更新に失敗しました:", error);
      toast.error("ログの更新に失敗しました。");
    } finally {
      setIsUpdating(false); // 更新処理終了フラグをリセット
    }
  };

  if (!isOpen) return null; // モーダルが閉じている場合は何も表示しない

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold mb-4">ログを編集</h2>

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

        <div className="mb-4">
          <label
            htmlFor="taskSelect"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            タスク
          </label>
          {logbookLoading ? (
            <p>タスク読み込み中...</p> // タスク取得中のUI
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
            <p>タスクがありません。設定から追加してください。</p> // タスク未登録時の表示
          )}
        </div>

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
            {isUpdating ? "更新中..." : "ログを更新"}
          </button>
        </div>
      </div>
    </div>
  );
};
