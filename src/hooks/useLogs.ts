'use client';

import { useState, useEffect, useCallback } from 'react';
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
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { usePetSelection } from '@/contexts/PetSelectionContext';
import type { Task, UserProfile, Log } from '@/lib/types';

import { toast } from 'sonner';

export const useLogActions = () => {
  const { user } = useAuth();
  const { selectedPet } = usePetSelection();

  const addLog = useCallback(async (task: Task, timestamp: Date, memo?: string) => {
    if (!user || !selectedPet) throw new Error('ユーザーまたはペットが選択されていません。');
    
    const logData = {
      petId: selectedPet.id,
      taskId: task.id,
      taskName: task.name,
      timestamp: Timestamp.fromDate(timestamp),
      note: memo || '',
      createdBy: user.uid,
      updatedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const logsCollection = collection(db, 'dogs', selectedPet.id, 'logs');
    await addDoc(logsCollection, logData);
  }, [user, selectedPet]);

  const updateLog = useCallback(async (logId: string, updatedData: Partial<Omit<Log, 'id' | 'petId' | 'createdBy' | 'createdAt'>>) => {
    if (!user || !selectedPet) throw new Error('ユーザーまたはペットが選択されていません。');
    const logRef = doc(db, 'dogs', selectedPet.id, 'logs', logId);
    await updateDoc(logRef, {
      ...updatedData,
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
      ...(updatedData.timestamp && { timestamp: updatedData.timestamp }),
    });
  }, [user, selectedPet]);

  const deleteLog = useCallback(async (logId: string) => {
    if (!user || !selectedPet) throw new Error('ユーザーまたはペットが選択されていません。');
    try {
      const logRef = doc(db, 'dogs', selectedPet.id, 'logs', logId);
      await deleteDoc(logRef);
      toast.success('ログを削除しました。');
    } catch (error) {
      console.error('ログの削除に失敗しました:', error);
      toast.error('ログの削除に失敗しました。');
    }
  }, [user, selectedPet]);

  return { addLog, updateLog, deleteLog };
};

export const useLogs = (targetDate: Date) => {
  const { user } = useAuth();
  const { selectedPet } = usePetSelection();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !selectedPet) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const petId = selectedPet.id;

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logsCollection = collection(db, 'dogs', petId, 'logs');
    const logsQuery = query(
      logsCollection,
      where('timestamp', '>=', startOfDay),
      where('timestamp', '<=', endOfDay),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(logsQuery, async (snapshot) => {
      const fetchedLogs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Log, 'id'>),
      }));

      const uniqueUserIds = Array.from(new Set([
        ...fetchedLogs.map(log => log.createdBy),
        ...fetchedLogs.map(log => log.updatedBy)
      ]));
      const userProfilesCache: { [uid: string]: UserProfile } = {};

      const userProfilePromises = uniqueUserIds.map(async (uid) => {
        if (uid) {
          const userProfileRef = doc(db, 'users', uid);
          const userProfileSnap = await getDoc(userProfileRef);
          if (userProfileSnap.exists()) {
            userProfilesCache[uid] = userProfileSnap.data() as UserProfile;
          }
        }
      });
      await Promise.all(userProfilePromises);

      const enrichedLogsPromises = fetchedLogs.map(async (logData) => {
        let createdByName: string | undefined;
        if (logData.createdBy && userProfilesCache[logData.createdBy]) {
          const userProfileData = userProfilesCache[logData.createdBy];
          createdByName = userProfileData.nickname || userProfileData.authName || userProfileData.authEmail;
        }

        let updatedByName: string | undefined;
        if (logData.updatedBy && userProfilesCache[logData.updatedBy]) {
          const userProfileData = userProfilesCache[logData.updatedBy];
          updatedByName = userProfileData.nickname || userProfileData.authName || userProfileData.authEmail;
        }

        const taskRef = doc(db, 'dogs', petId, 'tasks', logData.taskId);
        const taskSnap = await getDoc(taskRef);
        const task = taskSnap.exists() ? (taskSnap.data() as Task) : null;
        const isTaskDeleted = !taskSnap.exists() || (task?.deleted === true);

        let creatorNameBgColor: string | undefined;
        let creatorNameTextColor: string | undefined;
        let timeBgColor: string | undefined;
        let timeTextColor: string | undefined;

        if (logData.createdBy && userProfilesCache[logData.createdBy]) {
          const userProfileData = userProfilesCache[logData.createdBy];
          const customColorsEnabled = userProfileData.settings?.logDisplayColors?.enabled ?? true;

          if (customColorsEnabled) {
            creatorNameBgColor = userProfileData.settings?.logDisplayColors?.creatorNameBg || '#e5e7eb';
            creatorNameTextColor = userProfileData.settings?.logDisplayColors?.creatorNameText || '#6b7280';
            timeBgColor = userProfileData.settings?.logDisplayColors?.timeBg || '#e5e7eb';
            timeTextColor = userProfileData.settings?.logDisplayColors?.timeText || '#4b5563';
          } else {
            creatorNameBgColor = task?.color || '#cccccc';
            creatorNameTextColor = task?.textColor || '#000000';
            timeBgColor = task?.color || '#cccccc';
            timeTextColor = task?.textColor || '#000000';
          }
        } else {
          creatorNameBgColor = '#e5e7eb';
          creatorNameTextColor = '#6b7280';
          timeBgColor = '#e5e7eb';
          timeTextColor = '#4b5563';
        }

        let deletedBgColor = '#6b7280';
        let deletedTextColor = '#ff0000';

        if (logData.createdBy && userProfilesCache[logData.createdBy]) {
          const userProfileData = userProfilesCache[logData.createdBy];
          const customColorsEnabled = userProfileData.settings?.logDisplayColors?.enabled ?? true;

          if (customColorsEnabled) {
            creatorNameBgColor = userProfileData.settings?.logDisplayColors?.creatorNameBg || '#e5e7eb';
            creatorNameTextColor = userProfileData.settings?.logDisplayColors?.creatorNameText || '#6b7280';
            timeBgColor = userProfileData.settings?.logDisplayColors?.timeBg || '#e5e7eb';
            timeTextColor = userProfileData.settings?.logDisplayColors?.timeText || '#4b5563';

            if (userProfileData.settings?.logDisplayColors?.deletedTaskBg) {
              deletedBgColor = userProfileData.settings.logDisplayColors.deletedTaskBg;
            }
            if (userProfileData.settings?.logDisplayColors?.deletedTaskText) {
              deletedTextColor = userProfileData.settings.logDisplayColors.deletedTaskText;
            }
          } else {
            creatorNameBgColor = task?.color || '#cccccc';
            creatorNameTextColor = task?.textColor || '#000000';
            timeBgColor = task?.color || '#cccccc';
            timeTextColor = task?.textColor || '#000000';
          }
        } else {
          creatorNameBgColor = '#e5e7eb';
          creatorNameTextColor = '#6b7280';
          timeBgColor = '#e5e7eb';
          timeTextColor = '#4b5563';
        }

        return {
          ...logData,
          taskColor: task?.color || '#cccccc',
          taskTextColor: isTaskDeleted ? deletedTextColor : (task?.textColor || '#000000'),
          isTaskDeleted: isTaskDeleted,
          createdByName: createdByName,
          updatedByName: updatedByName,
          creatorNameBgColor: isTaskDeleted ? deletedBgColor : creatorNameBgColor, 
          creatorNameTextColor: isTaskDeleted ? deletedTextColor : creatorNameTextColor,
          timeBgColor: isTaskDeleted ? deletedBgColor : timeBgColor,
          timeTextColor: isTaskDeleted ? deletedTextColor : timeTextColor,
        };
      });

      const enrichedLogs = await Promise.all(enrichedLogsPromises);
      enrichedLogs.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());
      setLogs(enrichedLogs);
      setLoading(false);
    }, (error) => {
      console.error('ログの取得に失敗しました:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedPet, targetDate]);

  return { logs, loading };
};