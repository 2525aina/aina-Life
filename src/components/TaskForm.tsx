"use client";

import { useState, useEffect } from "react";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  petId: string;
}

export function TaskForm({
  isOpen,
  onClose,
  taskToEdit,
  petId,
}: TaskFormProps) {
  const { addTask, updateTask, deleteTask } = useTasks(petId);
  const [formData, setFormData] = useState({
    name: "",
    color: "#000000",
    textColor: "#FFFFFF",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setFormData({
          name: taskToEdit.name,
          color: taskToEdit.color,
          textColor: taskToEdit.textColor || "#FFFFFF",
        });
      } else {
        setFormData({ name: "", color: "#000000", textColor: "#FFFFFF" });
      }
    }
  }, [isOpen, taskToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("タスク名は必須です。");
      return;
    }
    if (formData.name.length > 15) {
      toast.error("タスク名は15文字以内で入力してください。");
      return;
    }
    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, {
          name: formData.name,
          color: formData.color,
          textColor: formData.textColor,
        });
        toast.success("タスクを更新しました。");
      } else {
        const taskData = { ...formData, order: new Date().getTime() };
        await addTask(taskData);
        toast.success("タスクを追加しました。");
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("タスクの保存に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {taskToEdit ? "タスクを編集" : "新しいタスクを追加"}
          </DialogTitle>
          <DialogDescription>
            タスクの詳細を入力してください。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              タスク名 *
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              背景色
            </Label>
            <Input
              id="color"
              name="color"
              type="color"
              value={formData.color}
              onChange={handleChange}
              className="col-span-1"
            />
            <Input
              type="text"
              value={formData.color}
              onChange={handleChange}
              name="color"
              className="col-span-2"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="textColor" className="text-right">
              文字色
            </Label>
            <Input
              id="textColor"
              name="textColor"
              type="color"
              value={formData.textColor}
              onChange={handleChange}
              className="col-span-1"
            />
            <Input
              type="text"
              value={formData.textColor}
              onChange={handleChange}
              name="textColor"
              className="col-span-2"
            />
          </div>
        </div>
        <DialogFooter>
          {taskToEdit && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isSubmitting}
            >
              削除
            </Button>
          )}
          <Button onClick={onClose} variant="outline">
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {taskToEdit && (
        <ConfirmationModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          title="タスクの削除確認"
          message="本当にこのタスクを削除しますか？この操作は元に戻せません。関連するログも非表示になります。"
          onConfirm={async () => {
            if (taskToEdit) {
              await deleteTask(taskToEdit.id);
              toast.success("タスクを削除しました。");
              onClose();
            }
            setIsDeleteConfirmOpen(false);
          }}
          confirmButtonText="削除する"
          cancelButtonText="キャンセル"
          isDestructive={true}
        />
      )}
    </Dialog>
  );
}
