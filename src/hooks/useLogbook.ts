// src/hooks/useLogbook.ts
// ペットごとのタスクとログを管理するカスタムフック。
// Firestoreから対象ペットのtasks・logsコレクションを監視し、CRUD操作を提供。
// 依存: useAuth, firebase/firestore, db(firebase初期化)

// Reactフック
import { useState, useEffect } from 'react';
// Firestore関連API
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  where,
  doc,
  updateDoc,
  deleteDoc,
  FieldValue, // Firestoreの特殊型を利用するため追加
} from 'firebase/firestore';
// Firebase初期化済みインスタンス
import { db } from '@/lib/firebase';
// 認証ユーザー取得
import { useAuth } from './useAuth';

// タスクデータ型定義
export interface Task {
  id: string;
  name: string;
  color: string;
  order: number;
  textColor?: string; // タスク表示用の文字色
}

// ログデータ型定義
export interface Log {
  id: string;
  petId: string; //どのペットのログか
  taskName: string;
  taskId: string;
  timestamp: Timestamp;
  note?: string; // 任意のメモ
  updatedAt?: Timestamp | FieldValue; // Firestoreの自動更新を許容
}

export const useLogbook = (petId?: string | null, targetDate?: Date) => {
  const { user } = useAuth(); // ログインユーザー情報
  const [tasks, setTasks] = useState<Task[]>([]); // ペットに紐づくタスク一覧
  const [logs, setLogs] = useState<Log[]>([]); // 当日のログ一覧
  const [loading, setLoading] = useState(true); // Firestoreからの読み込み状態

  useEffect(() => {
    // 未ログイン、またはペット未選択の場合はデータをリセット
    if (!user || !petId) {
      setTasks([]);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // --- タスクの購読 ---
    const tasksCollection = collection(db, 'dogs', petId, 'tasks');
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

    // --- ログの購読 ---
    const logsCollection = collection(db, 'dogs', petId, 'logs');
    // 参照する日付範囲を決定（デフォルトは今日）
    const dateToFetch = targetDate || new Date();
    const startOfDay = new Date(dateToFetch);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateToFetch);
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

    // コンポーネントアンマウント時に購読解除
    return () => {
      unsubscribeTasks();
      unsubscribeLogs();
    };
  }, [user, petId, targetDate]);

  // ログを追加する関数
  const addLog = async (task: Task, logTime?: string, note?: string) => {
    if (!user) {
      alert('ログインが必要です。');
      return;
    }
    if (!petId) {
      alert('ペットが選択されていません。');
      return;
    }

    try {
      const logsCollection = collection(db, 'dogs', petId, 'logs');

      let timestampToUse;
      if (logTime) {
        // 指定された時刻(HH:mm)を当日の日付に反映
        const [hours, minutes] = logTime.split(':').map(Number);
        const now = new Date();
        now.setHours(hours, minutes, 0, 0);
        timestampToUse = now;
      } else {
        timestampToUse = serverTimestamp(); // 未指定ならサーバー時刻
      }

      await addDoc(logsCollection, {
        petId: petId, // ペットIDを追加
        taskName: task.name,
        taskId: task.id,
        timestamp: timestampToUse,
        inputType: logTime ? 'manual' : 'auto',
        note: note || '',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('ログの記録に失敗しました:', error);
      alert('ログの記録に失敗しました。');
    }
  };

  // ログを更新する関数
  const updateLog = async (logId: string, updatedData: Partial<Log>) => {
    if (!user || !petId) {
      alert('ログインが必要です。');
      return;
    }
    try {
      const logRef = doc(db, 'dogs', petId, 'logs', logId);
      await updateDoc(logRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('ログの更新に失敗しました:', error);
      alert('ログの更新に失敗しました。');
    }
  };

  // ログを削除する関数
  const deleteLog = async (logId: string) => {
    if (!user || !petId) {
      alert('ログインが必要です。');
      return;
    }
    if (!confirm('本当にこのログを削除しますか？')) {
      return;
    }
    try {
      const logRef = doc(db, 'dogs', petId, 'logs', logId);
      await deleteDoc(logRef);
    } catch (error) {
      console.error('ログの削除に失敗しました:', error);
      alert('ログの削除に失敗しました。');
    }
  };

  // タスクを追加する関数
  const addTask = async (taskData: Omit<Task, 'id'>) => {
    if (!user || !petId) {
      alert('ログインが必要です。');
      return;
    }
    try {
      const tasksCollection = collection(db, 'dogs', petId, 'tasks');
      await addDoc(tasksCollection, {
        ...taskData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('タスクの追加に失敗しました:', error);
      alert('タスクの追加に失敗しました。');
    }
  };

  // タスクを更新する関数
  const updateTask = async (taskId: string, updatedData: Partial<Task>) => {
    if (!user || !petId) {
      alert('ログインが必要です。');
      return;
    }
    try {
      const taskRef = doc(db, 'dogs', petId, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      alert('タスクの更新に失敗しました。');
    }
  };

  // タスクを削除する関数
  const deleteTask = async (taskId: string) => {
    if (!user || !petId) {
      alert('ログインが必要です。');
      return;
    }
    if (!confirm('本当にこのタスクを削除しますか？')) {
      return;
    }
    try {
      const taskRef = doc(db, 'dogs', petId, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('タスクの削除に失敗しました:', error);
      alert('タスクの削除に失敗しました。');
    }
  };

  // タスクの並び順を更新する関数
  const reorderTasks = async (reorderedTasks: Task[]) => {
    if (!user || !petId) {
      alert('ログインが必要です。');
      return;
    }
    try {
      // 本来はバッチ更新が効率的だが、シンプル化のためループで更新
      for (const task of reorderedTasks) {
        const taskRef = doc(db, 'dogs', petId, 'tasks', task.id);
        await updateDoc(taskRef, {
          order: task.order,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('タスクの並び順の更新に失敗しました:', error);
      alert('タスクの並び順の更新に失敗しました。');
    }
  };

  return {
    tasks,
    logs,
    loading,
    addLog,
    updateLog,
    deleteLog,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
};