// src/hooks/useLogbook.ts
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

// Taskデータ型定義
export interface Task {
  id: string;
  name: string;
  color: string;
  order: number;
}

// Logデータ型定義 (今回は未使用だが、将来の履歴表示用)
export interface Log {
  id: string;
  taskName: string;
  taskId: string;
  timestamp: Timestamp;
}

// TODO: 将来的には、現在選択中のペットIDを動的に取得する
const TEMP_DOG_ID = 'dog1';

export const useLogbook = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<Log[]>([]); // ★ logs用のstateを追加
  const [loading, setLoading] = useState(true);

  // 副作用フックでタスク一覧とログをFirestoreから取得
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLogs([]); // ★ログもクリア
      setLoading(false);
      return;
    }

    // 1. タスクの監視
    const tasksCollection = collection(db, 'dogs', TEMP_DOG_ID, 'tasks');
    const tasksQuery = query(tasksCollection, orderBy('order'));
    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Task, 'id'>),
        }));
        setTasks(fetchedTasks);
        setLoading(false);
      },
      (error) => {
        console.error('タスクの取得に失敗しました:', error);
        setLoading(false);
      }
    );

    // 2. ★今日のログの監視
    const logsCollection = collection(db, 'dogs', TEMP_DOG_ID, 'logs');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logsQuery = query(
      logsCollection,
      where('timestamp', '>=', startOfDay),
      where('timestamp', '<', endOfDay),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Log, 'id'>),
      }));
      setLogs(fetchedLogs);
    });

    // クリーンアップ関数で両方の監視を停止
    return () => {
      unsubscribeTasks();
      unsubscribeLogs();
    };
  }, [user]);

  // 新しいログを追加する関数
  const addLog = async (task: Task) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }

    try {
      const logsCollection = collection(db, 'dogs', TEMP_DOG_ID, 'logs');
      await addDoc(logsCollection, {
        taskName: task.name,
        taskId: task.id,
        timestamp: serverTimestamp(),
        inputType: 'auto',
        note: '',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('ログの記録に失敗しました:', error);
      alert('ログの記録に失敗しました。');
    }
  };

  return { tasks, logs, loading, addLog }; // ★返り値にlogsを追加
};
