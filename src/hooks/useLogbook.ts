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
  doc,
  updateDoc,
  deleteDoc,
  FieldValue, // ★追加
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
  note?: string; // ★追加：メモ
  updatedAt?: Timestamp | FieldValue; // ★修正：FieldValueも許容
}

export const useLogbook = (targetDate?: Date) => {
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

    // 2. ログの監視
    const logsCollection = collection(db, 'dogs', selectedPetId, 'logs'); // ★ IDを動的に

    // targetDateが指定されていればそれを使用、なければ今日の日付をデフォルトとする
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

    // クリーンアップ関数で両方の監視を停止
    return () => {
      unsubscribeTasks();
      unsubscribeLogs();
    };
  }, [user, selectedPetId, targetDate]); // ★ targetDateを依存配列に追加

  // 新しいログを追加する関数
  const addLog = async (task: Task, logTime?: string, note?: string) => {
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

      let timestampToUse;
      if (logTime) {
        // logTime (HH:mm) を今日のDateオブジェクトに変換
        const [hours, minutes] = logTime.split(':').map(Number);
        const now = new Date();
        now.setHours(hours, minutes, 0, 0); // 秒とミリ秒は0に設定
        timestampToUse = now;
      } else {
        timestampToUse = serverTimestamp(); // 時刻が指定されなければサーバータイムスタンプ
      }

      await addDoc(logsCollection, {
        taskName: task.name,
        taskId: task.id,
        timestamp: timestampToUse, // 修正
        inputType: logTime ? 'manual' : 'auto', // 時刻が指定されればmanual
        note: note || '', // メモを追加
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
    if (!user || !selectedPetId) {
      alert('ログインが必要です。');
      return;
    }
    try {
      const logRef = doc(db, 'dogs', selectedPetId, 'logs', logId);
      await updateDoc(logRef, {
        ...updatedData,
        updatedAt: serverTimestamp(), // 更新日時を自動更新
      });
      console.log('ログを更新しました:', logId);
    } catch (error) {
      console.error('ログの更新に失敗しました:', error);
      alert('ログの更新に失敗しました。');
    }
  };

  // ログを削除する関数
  const deleteLog = async (logId: string) => {
    if (!user || !selectedPetId) {
      alert('ログインが必要です。');
      return;
    }
    if (!confirm('本当にこのログを削除しますか？')) {
      return;
    }
    try {
      const logRef = doc(db, 'dogs', selectedPetId, 'logs', logId);
      await deleteDoc(logRef);
      console.log('ログを削除しました:', logId);
    } catch (error) {
      console.error('ログの削除に失敗しました:', error);
      alert('ログの削除に失敗しました。');
    }
  };

  // 新しいタスクを追加する関数
  const addTask = async (taskData: Omit<Task, 'id'>) => {
    if (!user || !selectedPetId) {
      alert('ログインが必要です。');
      return;
    }
    try {
      const tasksCollection = collection(db, 'dogs', selectedPetId, 'tasks');
      await addDoc(tasksCollection, {
        ...taskData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('タスクを追加しました:', taskData.name);
    } catch (error) {
      console.error('タスクの追加に失敗しました:', error);
      alert('タスクの追加に失敗しました。');
    }
  };

  // タスクを更新する関数
  const updateTask = async (taskId: string, updatedData: Partial<Task>) => {
    if (!user || !selectedPetId) {
      alert('ログインが必要です。');
      return;
    }
    try {
      const taskRef = doc(db, 'dogs', selectedPetId, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
      console.log('タスクを更新しました:', taskId);
    } catch (error) {
      console.error('タスクの更新に失敗しました:', error);
      alert('タスクの更新に失敗しました。');
    }
  };

  // タスクを削除する関数
  const deleteTask = async (taskId: string) => {
    if (!user || !selectedPetId) {
      alert('ログインが必要です。');
      return;
    }
    if (!confirm('本当にこのタスクを削除しますか？')) {
      return;
    }
    try {
      const taskRef = doc(db, 'dogs', selectedPetId, 'tasks', taskId);
      await deleteDoc(taskRef);
      console.log('タスクを削除しました:', taskId);
    } catch (error) {
      console.error('タスクの削除に失敗しました:', error);
      alert('タスクの削除に失敗しました。');
    }
  };

  // タスクの並び順を更新する関数
  const reorderTasks = async (reorderedTasks: Task[]) => {
    if (!user || !selectedPetId) {
      alert('ログインが必要です。');
      return;
    }
    try {
      // Firestoreのトランザクションまたはバッチ書き込みを使用するとより効率的だが、
      // シンプルさのため個別に更新
      for (const task of reorderedTasks) {
        const taskRef = doc(db, 'dogs', selectedPetId, 'tasks', task.id);
        await updateDoc(taskRef, {
          order: task.order,
          updatedAt: serverTimestamp(),
        });
      }
      console.log('タスクの並び順を更新しました。');
    } catch (error) {
      console.error('タスクの並び順の更新に失敗しました:', error);
      alert('タスクの並び順の更新に失敗しました。');
    }
  };

  return { tasks, logs, loading, addLog, updateLog, deleteLog, addTask, updateTask, deleteTask, reorderTasks };
};