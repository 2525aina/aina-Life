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
import { usePets } from './usePets'; // ★ usePetsをインポート

// Taskデータ型定義
export interface Task {
  id: string;
  name: string;
  color: string;
  order: number;
}

// Logデータ型定義
export interface Log {
  id: string;
  taskName: string;
  taskId: string;
  timestamp: Timestamp;
}

export const useLogbook = () => {
  const { user } = useAuth();
  const { selectedPetId } = usePets(); // ★ 選択中のペットIDを取得
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  // 副作用フックでタスク一覧とログをFirestoreから取得
  useEffect(() => {
    // ユーザーがいない、またはペットが選択されていない場合は何もしない
    if (!user || !selectedPetId) {
      setTasks([]);
      setLogs([]);
      setLoading(false);
      return;
    }

    // 1. タスクの監視
    const tasksCollection = collection(db, 'dogs', selectedPetId, 'tasks'); // ★ IDを動的に
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

    // 2. 今日のログの監視
    const logsCollection = collection(db, 'dogs', selectedPetId, 'logs'); // ★ IDを動的に
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
  }, [user, selectedPetId]); // ★ selectedPetIdに依存させる

  // 新しいログを追加する関数
  const addLog = async (task: Task) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    if (!selectedPetId) {
      alert('ペットが選択されていません。');
      return;
    }

    try {
      const logsCollection = collection(db, 'dogs', selectedPetId, 'logs'); // ★ IDを動的に
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

  return { tasks, logs, loading, addLog };
};