'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { useLogbook, Task } from '@/hooks/useLogbook';
import { TaskFormModal } from '@/components/TaskFormModal'; // Import TaskFormModal

export default function TaskManagementPage() {
  const { tasks, loading, addTask, updateTask, deleteTask } = useLogbook();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); // State for form modal
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null); // State for task being edited

  const handleAddTask = () => {
    setTaskToEdit(null); // For add mode
    setIsFormModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task); // For edit mode
    setIsFormModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header />
      <main className="flex-grow w-full p-4 pb-16">
        <h1 className="text-3xl font-bold mb-4 text-white text-center">タスク管理画面</h1>

        {loading ? (
          <div className="text-center text-white">タスクを読み込み中...</div>
        ) : (
          <div className="max-w-lg mx-auto bg-gray-700 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-white">登録済みタスク</h2>
            <ul className="space-y-2">
              {tasks.length === 0 ? (
                <li className="text-white">タスクがありません。新しいタスクを追加しましょう。</li>
              ) : (
                tasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between bg-gray-600 p-3 rounded-md">
                    <span className="text-white">{task.name}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-blue-300 hover:text-blue-100 text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-300 hover:text-red-100 text-sm"
                      >
                        削除
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <button
              onClick={handleAddTask}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
            >
              新しいタスクを追加
            </button>
          </div>
        )}
      </main>
      <FooterNav />

      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}