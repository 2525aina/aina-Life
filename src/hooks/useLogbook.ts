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
  const [loading, setLoading] = useState(true);

  // 副作用フックでタスク一覧をFirestoreから取得
  useEffect(() => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const tasksCollection = collection(db, 'dogs', TEMP_DOG_ID, 'tasks');
    const q = query(tasksCollection, orderBy('order'));

    // onSnapshotでリアルタイムにデータを監視
    const unsubscribe = onSnapshot(
      q,
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

    // クリーンアップ関数で監視を停止
    return () => unsubscribe();
  }, [user]); // userの変更を検知して再実行

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

  return { tasks, loading, addLog };
};
