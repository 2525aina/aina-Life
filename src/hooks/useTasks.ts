'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';

export const useTasks = (dogId: string) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !dogId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const tasksCollection = collection(db, 'dogs', dogId, 'tasks');
    const tasksQuery = query(tasksCollection, orderBy('order'));

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Task, 'id'>),
      })).filter(task => !task.deleted);
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error('タスクの取得に失敗しました:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, dogId]);

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    if (!user || !dogId) {
      toast.error('ユーザーまたはペットが選択されていません。');
      throw new Error('ユーザーまたはペットが選択されていません。');
    }
    const tasksCollection = collection(db, 'dogs', dogId, 'tasks');
    await addDoc(tasksCollection, {
      ...taskData,
      deleted: false,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    });
  };

  const updateTask = async (taskId: string, updatedData: Partial<Omit<Task, 'id' | 'createdBy' | 'createdAt'>>) => {
    if (!user || !dogId) {
      toast.error('ユーザーまたはペットが選択されていません。');
      throw new Error('ユーザーまたはペットが選択されていません。');
    }

    const batch = writeBatch(db);
    const taskRef = doc(db, 'dogs', dogId, 'tasks', taskId);

    batch.update(taskRef, {
      ...updatedData,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    });

    if (updatedData.name) {
      const logsQuery = query(
        collection(db, 'dogs', dogId, 'logs'),
        where('taskId', '==', taskId)
      );
      const logsSnapshot = await getDocs(logsQuery);

      logsSnapshot.forEach((logDoc) => {
        batch.update(logDoc.ref, {
          taskName: updatedData.name,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      });
    }

    await batch.commit();
  };

  const deleteTask = async (taskId: string) => {
    if (!user || !dogId) {
      toast.error('ユーザーまたはペットが選択されていません。');
      return;
    }

    const batch = writeBatch(db);
    const taskRef = doc(db, 'dogs', dogId, 'tasks', taskId);

    batch.update(taskRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    });

    const logsQuery = query(
      collection(db, 'dogs', dogId, 'logs'),
      where('taskId', '==', taskId)
    );
    const logsSnapshot = await getDocs(logsQuery);

    logsSnapshot.forEach((logDoc) => {
      batch.update(logDoc.ref, {
        deleted: true,
        deletedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    if (!user || !dogId) {
      toast.error('ユーザーまたはペットが選択されていません。');
      throw new Error('ユーザーまたはペットが選択されていません。');
    }
    try {
      for (const task of reorderedTasks) {
        const taskRef = doc(db, 'dogs', dogId, 'tasks', task.id);
        await updateDoc(taskRef, {
          order: task.order,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "不明なエラー";
      console.error('タスクの並び順の更新に失敗しました:', errorMessage);
      toast.error('タスクの並び順の更新に失敗しました。');
    }
  };

  const bulkDeleteTasks = async (taskIds: string[]) => {
    if (!user || !dogId) {
      toast.error('ユーザーまたはペットが選択されていません。');
      return;
    }

    const batch = writeBatch(db);

    for (const taskId of taskIds) {
      const taskRef = doc(db, 'dogs', dogId, 'tasks', taskId);
      batch.update(taskRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        updatedBy: user.uid,
        updatedAt: serverTimestamp(),
      });

      const logsQuery = query(
        collection(db, 'dogs', dogId, 'logs'),
        where('taskId', '==', taskId)
      );
      const logsSnapshot = await getDocs(logsQuery);

      logsSnapshot.forEach((logDoc) => {
        batch.update(logDoc.ref, {
          deleted: true,
          deletedAt: serverTimestamp(),
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        });
      });
    }

    await batch.commit();
    toast.success(`${taskIds.length}件のタスクと関連データが論理削除されました。`);
  };

  return { tasks, loading, addTask, updateTask, deleteTask, reorderTasks, bulkDeleteTasks };
};
