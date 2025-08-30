// src/app/settings/tasks/page.tsx
// タスク管理画面のページコンポーネント。
// タスクの一覧表示、追加、編集、削除、並び替え（ドラッグ&ドロップ）を提供。
// 依存: useLogbook, TaskFormModal, Header, FooterNav, dnd-kit

"use client"; // クライアントサイドで実行

import React, { useState } from "react";
import { Header } from "@/components/Header"; // 共通ヘッダー
import { FooterNav } from "@/components/FooterNav"; // 共通フッターナビ
import { useLogbook, Task } from "@/hooks/useLogbook"; // タスク管理用フック
import { TaskFormModal } from "@/components/TaskFormModal"; // タスク追加/編集用モーダル

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"; // ドラッグ&ドロップの基本機能
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"; // ソート可能なリスト用
import { CSS } from "@dnd-kit/utilities"; // transform用ユーティリティ
import { arrayMove } from "@dnd-kit/sortable"; // 配列並び替え用ユーティリティ

// `SortableTaskItem` コンポーネント
interface SortableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({
  task,
  onEdit,
  onDelete,
}) => {
  // useSortableフックでDND操作に必要な情報を取得
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  // transform と transition を適用してドラッグアニメーションを実現
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef} // DOM参照をDNDに渡す
      style={style}
      {...attributes} // アクセシビリティ属性
      className="flex items-center justify-between bg-gray-600 p-3 rounded-md cursor-grab"
    >
      <span className="text-white" {...listeners}>
        {task.name}
      </span>{" "}
      {/* ドラッグ用リスナー */}
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(task)}
          className="text-blue-300 hover:text-blue-100 text-sm"
        >
          編集
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-red-300 hover:text-red-100 text-sm"
        >
          削除
        </button>
      </div>
    </li>
  );
};

// ページコンポーネント本体
export default function TaskManagementPage() {
  const { tasks, loading, addTask, updateTask, deleteTask, reorderTasks } =
    useLogbook(); // タスク管理フック
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); // モーダル開閉状態
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null); // 編集対象タスク

  // DND用センサー設定（マウス・キーボード対応）
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates, // キーボード操作時の座標取得
    })
  );

  // タスク追加ボタン押下時
  const handleAddTask = () => {
    setTaskToEdit(null); // 新規タスクなので編集対象なし
    setIsFormModalOpen(true);
  };

  // タスク編集ボタン押下時
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task); // 編集対象をセット
    setIsFormModalOpen(true);
  };

  // タスク削除処理
  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  // ドラッグ終了時に並び順を更新
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over?.id);

      // 新しい順序に配列を並べ替え
      const newOrderTasks = arrayMove(tasks, oldIndex, newIndex).map(
        (task, index) => ({
          ...task,
          order: index, // orderプロパティを更新
        })
      );

      // Firestore経由で状態を更新
      await reorderTasks(newOrderTasks);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header /> {/* 共通ヘッダー */}
      <main className="flex-grow w-full p-4 pb-16">
        <h1 className="text-3xl font-bold mb-4 text-white text-center">
          タスク管理画面
        </h1>

        {loading ? (
          <div className="text-center text-white">タスクを読み込み中...</div>
        ) : (
          <div className="max-w-lg mx-auto bg-gray-700 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-white">
              登録済みタスク
            </h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter} // ドラッグ時の衝突判定
              onDragEnd={handleDragEnd} // ドラッグ終了時処理
            >
              <SortableContext
                items={tasks.map((task) => task.id)} // 並べ替え対象
                strategy={verticalListSortingStrategy} // 垂直リスト向けソート戦略
              >
                <ul className="space-y-2">
                  {tasks.length === 0 ? (
                    <li className="text-white">
                      タスクがありません。新しいタスクを追加しましょう。
                    </li>
                  ) : (
                    tasks.map((task) => (
                      <SortableTaskItem
                        key={task.id}
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))
                  )}
                </ul>
              </SortableContext>
            </DndContext>
            <button
              onClick={handleAddTask}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
            >
              新しいタスクを追加
            </button>
          </div>
        )}
      </main>
      <FooterNav /> {/* 共通フッターナビ */}
      <TaskFormModal
        isOpen={isFormModalOpen} // モーダル開閉状態
        onClose={() => setIsFormModalOpen(false)} // 閉じる処理
        taskToEdit={taskToEdit} // 編集対象タスク
      />
    </div>
  );
}
