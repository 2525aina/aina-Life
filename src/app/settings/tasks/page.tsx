'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { useLogbook, Task } from '@/hooks/useLogbook';
import { TaskFormModal } from '@/components/TaskFormModal'; // Import TaskFormModal

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable'; // Helper for reordering arrays

// SortableTaskItem Component
interface SortableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ task, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between bg-gray-600 p-3 rounded-md cursor-grab"
    >
      <span className="text-white" {...listeners}>{task.name}</span> {/* listeners for drag handle */}
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


export default function TaskManagementPage() {
  const { tasks, loading, addTask, updateTask, deleteTask, reorderTasks } = useLogbook();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsFormModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over?.id);

      const newOrderTasks = arrayMove(tasks, oldIndex, newIndex).map((task, index) => ({
        ...task,
        order: index, // Update the order property based on new index
      }));

      // Update local state immediately for smooth UI
      // useLogbook's tasks state will eventually update from Firestore snapshot
      // For now, we don't have a direct way to update useLogbook's internal tasks state
      // Or, rely solely on Firestore snapshot for state updates (which might have a slight delay)
      // For now, we'll just call reorderTasks and let Firestore handle the state update.
      await reorderTasks(newOrderTasks);
    }
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tasks.map(task => task.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {tasks.length === 0 ? (
                    <li className="text-white">タスクがありません。新しいタスクを追加しましょう。</li>
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
      <FooterNav />

      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}