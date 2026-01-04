'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/features/AppLayout';
import { useCustomTasks } from '@/hooks/useCustomTasks';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Trash2, GripVertical, Edit2 } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';
import { toast } from 'sonner';
import type { CustomTask } from '@/lib/types';

const EMOJI_OPTIONS = ['📝', '🍚', '🚶', '💊', '🏥', '💉', '✂️', '🛁', '🦴', '🎾', '🧸', '🎀', '🐾', '❤️', '⭐', '🌟', '✅', '📌'];

function TasksContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const petId = searchParams.get('id');

    const { tasks, loading, addTask, updateTask, deleteTask, reorderTasks } = useCustomTasks(petId);
    const { canEdit } = useMembers(petId);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<CustomTask | null>(null);
    const [taskName, setTaskName] = useState('');
    const [taskEmoji, setTaskEmoji] = useState('📝');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderedTasks, setOrderedTasks] = useState<CustomTask[]>([]);

    // tasks が変化したら orderedTasks を更新
    useState(() => {
        setOrderedTasks(tasks);
    });

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
        setOrderedTasks(newOrder);
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

    if (!petId) {
        return (
            <AppLayout>
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">ペットが選択されていません</p>
                    <Button onClick={() => router.push('/dashboard')} className="mt-4">ダッシュボードに戻る</Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-4 space-y-6 pb-24">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
                        <h1 className="text-xl font-bold">カスタムタスク</h1>
                    </div>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">タスク一覧</CardTitle>
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
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {EMOJI_OPTIONS.map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                onClick={() => setTaskEmoji(emoji)}
                                                                className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${taskEmoji === emoji ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'}`}
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
                                <p className="text-center text-muted-foreground py-8">カスタムタスクはまだありません</p>
                            ) : (
                                <Reorder.Group axis="y" values={tasks} onReorder={handleReorder} className="space-y-2">
                                    {tasks.map((task) => (
                                        <Reorder.Item key={task.id} value={task}>
                                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                                <span className="text-xl">{task.emoji}</span>
                                                <span className="flex-1 font-medium">{task.name}</span>
                                                {canEdit && (
                                                    <div className="flex gap-1">
                                                        <Dialog open={editingTask?.id === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(task)}>
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
                                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                                            {EMOJI_OPTIONS.map((emoji) => (
                                                                                <button
                                                                                    key={emoji}
                                                                                    type="button"
                                                                                    onClick={() => setTaskEmoji(emoji)}
                                                                                    className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${taskEmoji === emoji ? 'border-primary bg-primary/10' : 'border-muted hover:border-muted-foreground/50'}`}
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
                                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
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
                </motion.div>
            </div>
        </AppLayout>
    );
}

export default function TasksPage() {
    return (
        <Suspense fallback={<AppLayout><div className="p-4 text-center py-12">読み込み中...</div></AppLayout>}>
            <TasksContent />
        </Suspense>
    );
}
