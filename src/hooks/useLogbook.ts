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
  getDocs, // ユーザー情報を取得するために追加
  writeBatch, // バッチ処理のために追加
  getDoc, // getDocを追加
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

// Firestoreのユーザーデータ型を定義 (useAuth.tsからコピー)
interface FirestoreUser {
  authName: string;
  authEmail: string;
  nickname?: string;
  birthday?: string;
  gender?: string;
  profileImageUrl?: string;
  introduction?: string;
  primaryPetId?: string;
  settings?: {
    theme?: "light" | "dark" | "system";
    notifications?: {
      dailySummary?: boolean;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ログデータ型定義
export interface Log {
  id: string;
  petId: string; //どのペットのログか
  taskName: string;
  taskId: string;
  timestamp: Timestamp;
  note?: string; // 任意のメモ
  createdBy: string; // ログを作成したユーザーのUID
  updatedBy: string; // ログを最後に更新したユーザーのUID
  createdAt: Timestamp; // 作成日時
  updatedAt: Timestamp; // 更新日時
  createdByUserNickname?: string; // 作成者のニックネーム (動的に取得)
  updatedByUserNickname?: string; // 更新者のニックネーム (動的に取得)
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
    const unsubscribeLogs = onSnapshot(logsQuery, async (snapshot) => {
      const fetchedLogsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Log, 'id'>),
      }));

      // ログから一意のユーザーIDを抽出
      const uniqueUserIds = Array.from(new Set([
        ...fetchedLogsData.map(log => log.createdBy),
        ...fetchedLogsData.map(log => log.updatedBy)
      ].filter(Boolean))); // nullやundefinedを除外

      // ユーザー情報を一括で取得
      const usersMap = new Map<string, string>(); // UID -> nickname
      if (uniqueUserIds.length > 0) {
        const usersQuery = query(collection(db, 'users'), where('__name__', 'in', uniqueUserIds));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(userDoc => {
          const userData = userDoc.data() as FirestoreUser;
          usersMap.set(userDoc.id, userData.nickname || userData.authName || '名無し');
        });
      }

      // ログデータにニックネームを付与
      const logsWithNicknames = fetchedLogsData.map(log => {
        const updaterId = log.updatedBy || log.createdBy; // Use updatedBy, fallback to createdBy
        return {
          ...log,
          createdByUserNickname: usersMap.get(log.createdBy) || '名無し',
          updatedByUserNickname: usersMap.get(updaterId) || '名無し',
        };
      });

      setLogs(logsWithNicknames);
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
        // 指定された時刻をDateオブジェクトとしてパース
        const parsedDate = new Date(logTime);
        if (isNaN(parsedDate.getTime())) {
          // パースに失敗した場合はサーバー時刻を使用
          timestampToUse = serverTimestamp();
        } else {
          timestampToUse = parsedDate;
        }
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
        updatedBy: user.uid, // 新規作成時は作成者が更新者
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
        updatedBy: user.uid, // 更新者を現在のユーザーに設定
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
        updatedBy: user.uid,
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
      // 既存のタスクデータを取得
      const taskRef = doc(db, 'dogs', petId, 'tasks', taskId);
      const taskSnap = await getDoc(taskRef);
      if (!taskSnap.exists()) {
        throw new Error("タスクが見つかりません。");
      }
      const oldTask = taskSnap.data() as Task;

      // タスク名を更新する場合、関連するログも更新
      if (updatedData.name && updatedData.name !== oldTask.name) {
        const logsCollection = collection(db, 'dogs', petId, 'logs');
        const logsQuery = query(logsCollection, where('taskId', '==', taskId));
        const logsSnapshot = await getDocs(logsQuery);

        const batch = writeBatch(db);
        logsSnapshot.docs.forEach(logDoc => {
          batch.update(logDoc.ref, { taskName: updatedData.name });
        });
        await batch.commit();
      }

      // タスク自体を更新
      await updateDoc(taskRef, {
        ...updatedData,
        updatedBy: user.uid,
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
          updatedBy: user.uid,
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