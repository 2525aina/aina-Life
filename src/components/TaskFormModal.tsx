// src/components/TaskFormModal.tsx
// タスクの新規作成・編集用モーダルコンポーネント。
// 依存: useLogbook（タスクの追加・更新処理を提供）

"use client";

import React, { useState, useEffect } from "react";
import { useLogbook, Task } from "@/hooks/useLogbook"; // タスク管理用フックと型定義

interface TaskFormModalProps {
  isOpen: boolean; // モーダルの開閉状態
  onClose: () => void; // モーダルを閉じる処理
  taskToEdit?: Task | null; // 編集対象タスク（新規作成時はnull）
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
}) => {
  const { addTask, updateTask, loading: logbookLoading } = useLogbook(); // タスク追加・更新処理を取得
  const [name, setName] = useState<string>(""); // タスク名入力
  const [color, setColor] = useState<string>("#000000"); // 背景色（初期値: 黒）
  const [textColor, setTextColor] = useState<string>("#FFFFFF"); // 文字色（初期値: 白）
  const [isSubmitting, setIsSubmitting] = useState(false); // 保存中フラグ

  // モーダルが開いたときにフォームを初期化する
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        // 編集モード: 既存タスクの情報を反映
        setName(taskToEdit.name);
        setColor(taskToEdit.color);
        setTextColor(taskToEdit.textColor || "#FFFFFF");
      } else {
        // 新規作成モード: 入力をリセット
        setName("");
        setColor("#000000");
        setTextColor("#FFFFFF");
      }
    }
  }, [isOpen, taskToEdit]);

  // 保存処理（新規 or 編集）
  const handleSubmit = async () => {
    if (!name || !color) {
      alert("タスク名と色を入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        // 編集処理
        await updateTask(taskToEdit.id, { name, color, textColor });
        alert("タスクを更新しました！");
      } else {
        // 新規作成処理
        const newOrder = 0; // TODO: 並び順ロジック導入時に修正
        await addTask({ name, color, textColor, order: newOrder });
        alert("タスクを追加しました！");
      }
      onClose(); // 完了後モーダルを閉じる
    } catch (error) {
      console.error("タスクの保存に失敗しました:", error);
      alert("タスクの保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null; // モーダル非表示時は何も描画しない

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* モードによってタイトルを切り替え */}
        <h2 className="text-2xl font-bold mb-4">
          {taskToEdit ? "タスクを編集" : "新しいタスクを追加"}
        </h2>

        {/* タスク名入力 */}
        <div className="mb-4">
          <label
            htmlFor="taskName"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            タスク名
          </label>
          <input
            type="text"
            id="taskName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="例: ご飯"
          />
        </div>

        {/* 背景色入力 */}
        <div className="mb-6">
          <label
            htmlFor="taskColor"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            背景色 (HEXコード)
          </label>
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

        {/* 文字色入力 */}
        <div className="mb-6">
          <label
            htmlFor="taskTextColor"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            文字色 (HEXコード)
          </label>
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

        {/* 操作用ボタン */}
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
            {isSubmitting ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
};
