"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskForm } from '@/components/TaskForm';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { toast } from 'sonner';

interface TaskHistoryProps {
  dogId: string;
}

function SortableItem({
  task,
  handleEdit,
  handleDelete,
  handleMoveUp,
  handleMoveDown,
  isEditFormOpen,
  taskToEdit,
  setIsEditFormOpen,
  isFirst,
  isLast,
  dogId,
}: {
  task: Task;
  handleEdit: (task: Task) => void;
  handleDelete: (taskId: string) => void;
  handleMoveUp: (taskId: string) => void;
  handleMoveDown: (taskId: string) => void;
  isEditFormOpen: boolean;
  taskToEdit: Task | null;
  setIsEditFormOpen: (isOpen: boolean) => void;
  isFirst: boolean;
  isLast: boolean;
  dogId: string;
}) {
  return (
    <TableRow>
      <TableCell className="w-8 py-0 px-1">
        <div className="flex flex-col items-center space-y-1">
          <Button variant="ghost" size="icon" onClick={() => handleMoveUp(task.id)} disabled={isFirst}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleMoveDown(task.id)} disabled={isLast}>
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="py-0 px-1" style={{ backgroundColor: task.color, color: task.textColor || '#FFFFFF' }}>
        {task.name}
      </TableCell>
      <TableCell className="py-0 px-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: task.color }}></div>
            <span>{task.color}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: task.textColor || '#FFFFFF' }}></div>
            <span>{task.textColor || '#FFFFFF'}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right py-0 px-1">
        <div className="flex flex-col items-end space-y-0">
          <Dialog open={isEditFormOpen && taskToEdit?.id === task.id} onOpenChange={setIsEditFormOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>タスクの編集</DialogTitle>
              </DialogHeader>
              <TaskForm petId={dogId} isOpen={true} onClose={() => setIsEditFormOpen(false)} taskToEdit={taskToEdit || undefined} />
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TaskHistory({ dogId }: TaskHistoryProps) {
  const { tasks, loading, deleteTask, reorderTasks } = useTasks(dogId);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsEditFormOpen(true);
  };

  const handleDelete = (taskId: string) => {
    setTaskToDeleteId(taskId);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDeleteId) {
      await deleteTask(taskToDeleteId);
      toast.success("タスクを削除しました。");
      setTaskToDeleteId(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleMoveTask = async (taskId: string, direction: "up" | "down") => {
    const currentTasks = [...tasks];
    const index = currentTasks.findIndex((task) => task.id === taskId);

    if (index === -1) return;

    let newIndex = index;
    if (direction === "up") {
      newIndex = Math.max(0, index - 1);
    } else if (direction === "down") {
      newIndex = Math.min(currentTasks.length - 1, index + 1);
    }

    if (newIndex === index) return;

    const [movedTask] = currentTasks.splice(index, 1);
    currentTasks.splice(newIndex, 0, movedTask);

    const updatedTasksWithOrder = currentTasks.map((task, idx) => ({
      ...task,
      order: idx,
    }));

    await reorderTasks(updatedTasksWithOrder);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="ml-2">タスク履歴をロード中...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <p>タスクがありません。</p>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>タスク名</TableHead>
            <TableHead>色</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task, index) => (
            <SortableItem
              key={task.id}
              task={task}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleMoveUp={(taskId) => handleMoveTask(taskId, "up")}
              handleMoveDown={(taskId) => handleMoveTask(taskId, "down")}
              isEditFormOpen={isEditFormOpen}
              taskToEdit={taskToEdit}
              setIsEditFormOpen={setIsEditFormOpen}
              isFirst={index === 0}
              isLast={index === tasks.length - 1}
              dogId={dogId}
            />
          ))}
        </TableBody>
      </Table>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="タスクの削除確認"
        message="本当にこのタスクを削除しますか？この操作は元に戻せません。関連するログも非表示になります。"
        onConfirm={handleConfirmDelete}
        confirmButtonText="削除する"
        cancelButtonText="キャンセル"
        isDestructive={true}
      />
    </div>
  );
}