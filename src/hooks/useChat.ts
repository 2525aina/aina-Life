import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Message } from '@/lib/types';

export const useChat = (petId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !petId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const messagesRef = collection(db, 'dogs', petId, 'chats');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Message, 'id'>
      }));
      setMessages(fetchedMessages);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching messages:", err);
      setError("メッセージの取得に失敗しました。");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, petId]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!user || !petId || !messageText.trim()) {
      toast.error("メッセージを送信できませんでした。");
      return;
    }

    try {
      await addDoc(collection(db, 'dogs', petId, 'chats'), {
        senderId: user.uid,
        messageText: messageText.trim(),
        timestamp: serverTimestamp(),
        isUnsent: false,
      });
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("メッセージの送信に失敗しました。");
    }
  }, [user, petId]);

  const unsendMessage = useCallback(async (messageId: string) => {
    if (!user || !petId || !messageId) {
      toast.error("メッセージを取り消しできませんでした。");
      return;
    }

    try {
      const messageRef = doc(db, 'dogs', petId, 'chats', messageId);
      await updateDoc(messageRef, {
        isUnsent: true,
      });
      toast.success("メッセージを取り消しました。");
    } catch (err) {
      console.error("Error unsending message:", err);
      toast.error("メッセージの取り消しに失敗しました。");
    }
  }, [user, petId]);

  const restoreMessage = useCallback(async (messageId: string) => {
    if (!user || !petId || !messageId) {
      toast.error("メッセージを復元できませんでした。");
      return;
    }

    try {
      const messageRef = doc(db, 'dogs', petId, 'chats', messageId);
      await updateDoc(messageRef, {
        isUnsent: false,
      });
      toast.success("メッセージを復元しました。");
    } catch (err) {
      console.error("Error restoring message:", err);
      toast.error("メッセージの復元に失敗しました。");
    }
  }, [user, petId]);

  return { messages, loading, error, sendMessage, unsendMessage, restoreMessage };
};
