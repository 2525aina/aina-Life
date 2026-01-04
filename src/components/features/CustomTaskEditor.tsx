'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Trash2, GripVertical, Edit2 } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { toast } from 'sonner';
import type { CustomTask } from '@/lib/types';
import { useCustomTasks } from '@/hooks/useCustomTasks';

const EMOJI_OPTIONS = Array.from(new Set([
    '📝', '🍚', '🍗', '🥦', '🥕', '🦴', '🥛', '🍪', // 食事
    '🚶', '🐕', '🐩', '🦮', '🐕‍🦺', '🌳', '💩', '🚽', // 散歩・排泄
    '💊', '🏥', '💉', '🩹', '🩺', '🌡️', '👀', '👂', // 医療
    '✂️', '🛁', '🚿', '🧼', '🧴', '💅', // ケア
    '💤', '🛌', '🏠', '🚗', '👜', // 生活
    '🎾', '🧸', '⚽', '🧶', '🎀', '👓', '👕', // 遊び・アイテム
    '❤️', '⭐', '🌟', '✨', '💡', '⚠️', '❓', '✅', '📌', '🎉' // その他
]));

interface CustomTaskEditorProps {
    petId: string;
    canEdit: boolean;
}

export function CustomTaskEditor({ petId, canEdit }: CustomTaskEditorProps) {
    const { tasks, loading, addTask, updateTask, deleteTask, reorderTasks } = useCustomTasks(petId);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<CustomTask | null>(null);
    const [taskName, setTaskName] = useState('');
    const [taskEmoji, setTaskEmoji] = useState('📝');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskName.trim()) return;
        setIsSubmitting(true);
        try {
            await addTask({ name: taskName.trim(), emoji: taskEmoji });
            toast.success('タスクを追加しました');
            setTaskName('');
            setTaskEmoji('📝');
            setIsAddDialogOpen(false);
        } catch {
            toast.error('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || !taskName.trim()) return;
        setIsSubmitting(true);
        try {
            await updateTask(editingTask.id, { name: taskName.trim(), emoji: taskEmoji });
            toast.success('タスクを更新しました');
            setEditingTask(null);
            setTaskName('');
            setTaskEmoji('📝');
        } catch {
            toast.error('エラーが発生しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await deleteTask(taskId);
            toast.success('タスクを削除しました');
        } catch {
            toast.error('エラーが発生しました');
        }
    };

    const handleReorder = async (newOrder: CustomTask[]) => {
        // Optimistic update handled by Reorder.Group, but we invoke hook to persist
        try {
            await reorderTasks(newOrder);
        } catch {
            toast.error('並び替えに失敗しました');
        }
    };

    const openEditDialog = (task: CustomTask) => {
        setEditingTask(task);
        setTaskName(task.name);
        setTaskEmoji(task.emoji);
    };

    return (

        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">カスタムタスク</CardTitle>
                        <CardDescription className="text-sm">記録時に選択できるカテゴリを管理</CardDescription>
                    </div>
                    {canEdit && (
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-1 gradient-primary"><Plus className="w-4 h-4" />追加</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>タスクを追加</DialogTitle>
                                    <DialogDescription>新しいカスタムタスクを作成します</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddTask} className="space-y-4 pt-4">
                                    <div>
                                        <Label htmlFor="task-name">タスク名</Label>
                                        <Input id="task-name" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="例：おやつ" className="mt-1" />
                                    </div>
                                    <div>
                                        <Label>絵文字</Label>
                                        <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-1">
                                            {EMOJI_OPTIONS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => setTaskEmoji(emoji)}
                                                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors flex-shrink-0 ${taskEmoji === emoji ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={isSubmitting || !taskName.trim()} className="w-full gradient-primary">
                                        {isSubmitting ? '追加中...' : '追加する'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}</div>
                ) : tasks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 bg-muted/20 rounded-lg">カスタムタスクはまだありません</p>
                ) : (
                    <Reorder.Group axis="y" values={tasks} onReorder={handleReorder} className="space-y-2">
                        {tasks.map((task) => (
                            <Reorder.Item key={task.id} value={task}>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-transparent hover:border-muted-foreground/20 transition-colors cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    <span className="text-xl w-8 text-center">{task.emoji}</span>
                                    <span className="flex-1 font-medium">{task.name}</span>
                                    {canEdit && (
                                        <div className="flex gap-1">
                                            <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(task)}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>タスクを編集</DialogTitle>
                                                        <DialogDescription>タスクの内容を変更します</DialogDescription>
                                                    </DialogHeader>
                                                    <form onSubmit={handleUpdateTask} className="space-y-4 pt-4">
                                                        <div>
                                                            <Label htmlFor="edit-task-name">タスク名</Label>
                                                            <Input id="edit-task-name" value={taskName} onChange={(e) => setTaskName(e.target.value)} className="mt-1" />
                                                        </div>
                                                        <div>
                                                            <Label>絵文字</Label>
                                                            <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-1">
                                                                {EMOJI_OPTIONS.map((emoji) => (
                                                                    <button
                                                                        key={emoji}
                                                                        type="button"
                                                                        onClick={() => setTaskEmoji(emoji)}
                                                                        className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors flex-shrink-0 ${taskEmoji === emoji ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'}`}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <Button type="submit" disabled={isSubmitting || !taskName.trim()} className="w-full gradient-primary">
                                                            {isSubmitting ? '更新中...' : '更新する'}
                                                        </Button>
                                                    </form>
                                                </DialogContent>
                                            </Dialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>タスクを削除</AlertDialogTitle>
                                                        <AlertDialogDescription>「{task.emoji} {task.name}」を削除しますか？</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-destructive text-destructive-foreground">削除</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </CardContent>
        </Card>
    );
}
