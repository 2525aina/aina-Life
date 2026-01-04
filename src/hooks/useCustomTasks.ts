'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { CustomTask } from '@/lib/types';

export function useCustomTasks(petId: string | null) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<CustomTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!petId || !user) {
            setTasks([]);
            setLoading(false);
            return;
        }

        const tasksQuery = query(
            collection(db, 'pets', petId, 'tasks'),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const tasksData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as CustomTask[];
            setTasks(tasksData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [petId, user]);

    const addTask = useCallback(async (taskData: { name: string; emoji: string }) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) + 1 : 0;

        await addDoc(collection(db, 'pets', petId, 'tasks'), {
            name: taskData.name,
            emoji: taskData.emoji,
            order: maxOrder,
            createdBy: user.uid,
            updatedBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    }, [petId, user, tasks]);

    const updateTask = useCallback(async (taskId: string, taskData: Partial<{ name: string; emoji: string }>) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const taskRef = doc(db, 'pets', petId, 'tasks', taskId);
        await updateDoc(taskRef, {
            ...taskData,
            updatedBy: user.uid,
            updatedAt: serverTimestamp(),
        });
    }, [petId, user]);

    const deleteTask = useCallback(async (taskId: string) => {
        if (!petId) throw new Error('ペットが選択されていません');

        const taskRef = doc(db, 'pets', petId, 'tasks', taskId);
        await deleteDoc(taskRef);
    }, [petId]);

    const reorderTasks = useCallback(async (reorderedTasks: CustomTask[]) => {
        if (!petId || !user) throw new Error('ペットが選択されていません');

        const batch = writeBatch(db);
        reorderedTasks.forEach((task, index) => {
            const taskRef = doc(db, 'pets', petId, 'tasks', task.id);
            batch.update(taskRef, {
                order: index,
                updatedBy: user.uid,
                updatedAt: serverTimestamp(),
            });
        });

        await batch.commit();
    }, [petId, user]);

    return { tasks, loading, addTask, updateTask, deleteTask, reorderTasks };
}
