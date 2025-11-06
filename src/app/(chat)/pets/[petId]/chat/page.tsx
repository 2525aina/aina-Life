"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@/hooks/useUser";
import { usePresence } from "@/hooks/usePresence"; // Import usePresence
import { useUserProfiles } from "@/hooks/useUserProfiles"; // Import the new hook
import { usePets } from "@/hooks/usePets";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format, differenceInSeconds } from "date-fns";
import { ja } from "date-fns/locale";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";

const MessageContent = ({ messageText, isUnsent }: { messageText: string, isUnsent?: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [showReadMore, setShowReadMore] = useState(false);

  useEffect(() => {
    if (contentRef.current) {
      setShowReadMore(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    }
  }, [messageText]);

  if (isUnsent) {
    return <p className="text-sm italic text-gray-500">このメッセージは取り消されました。</p>;
  }

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
      <p
        ref={contentRef}
        className={`text-sm break-words break-all whitespace-pre-wrap ${!isExpanded ? 'max-h-48 overflow-y-auto' : ''}`}
      >
        {renderTextWithLinks(messageText)}
      </p>
      {showReadMore && (
        <Button
          variant="link"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0 h-auto text-xs mt-1"
        >
          {isExpanded ? "閉じる" : "もっと見る"}
        </Button>
      )}
    </>
  );
};

export const dynamic = "force-dynamic";
export default function PetChatPage() {
  const { petId } = useParams<{ petId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { userProfile, updateUserProfile } = useUser();
  const { messages, loading, error, sendMessage, unsendMessage, restoreMessage } = useChat(petId);

  const senderIds = useMemo(() => {
    const ids = new Set<string>();
    messages.forEach(msg => ids.add(msg.senderId));
    if (user?.uid) ids.add(user.uid); // Ensure current user's profile is also fetched
    return Array.from(ids);
  }, [messages, user?.uid]);

  const { userProfiles, loading: userProfilesLoading } = useUserProfiles(senderIds);
  const { isUserOnline } = usePresence(senderIds); // Call usePresence

  const participantCount = senderIds.length;

  const { pets } = usePets();
  const currentPet = pets.find((pet) => pet.id === petId);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user || !updateUserProfile) return;

    const requestPermissionAndSaveToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const messaging = getMessaging(app);
          const currentToken = await getToken(messaging, {
            vapidKey: "BIPmppmNKFhoBYKGh0hHA6IqM_XCnFCk-Ac2BQPmFekuwiG2HhZrllyI5UVBtVvTv_9uA8WnPjRaCLC_2k-oTOY",
          });

          if (currentToken) {
            // Save the token to user's profile in Firestore
            const currentTokens = userProfile?.fcmTokens || [];
            if (!currentTokens.includes(currentToken)) {
              await updateUserProfile({ fcmTokens: [...currentTokens, currentToken] });
              toast.success("プッシュ通知が有効になりました！");
            }
          } else {
            console.log("No registration token available. Request permission to generate one.");
          }
        } else {
          console.log("Notification permission denied.");
        }
      } catch (err) {
        console.error("An error occurred while retrieving token.", err);
        toast.error("プッシュ通知の登録に失敗しました。");
      }
    };

    requestPermissionAndSaveToken();

    // Handle foreground messages
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      const url = payload.data?.url;
      toast.info(payload.notification?.title || "新しい通知", {
        description: payload.notification?.body,
        duration: 5000,
        action: url ? {
          label: "開く",
          onClick: () => window.open(url, "_blank"),
        } : undefined,
      });
    });

    return () => unsubscribe();
  }, [user, userProfile, updateUserProfile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!userProfile?.nickname) {
      toast.error(
        "プロフィール名が設定されていません。設定ページで設定してください。"
      );
      return;
    }

    await sendMessage(newMessage);
    setNewMessage("");
  };

  const handleUnsendMessage = async (messageId: string) => {
    await unsendMessage(messageId);
  };

  const handleRestoreMessage = async (messageId: string) => {
    await restoreMessage(messageId);
  };

  const handleCopyMessage = async (messageText: string) => {
    try {
      await navigator.clipboard.writeText(messageText);
      toast.success("メッセージをコピーしました！");
    } catch (err) {
      console.error("Failed to copy message:", err);
      toast.error("メッセージのコピーに失敗しました。");
    }
  };

  if (loading || userProfilesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">チャットを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">このページを表示するにはログインが必要です。</p>
        <Link href="/login">
          <Button>ログインページへ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => router.push("/pets")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold ml-2">
            {currentPet ? `${currentPet.name} (${participantCount}人)` : "ペットチャット"}
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            まだメッセージはありません。
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const prevDate = prevMsg && prevMsg.timestamp
              ? format(prevMsg.timestamp.toDate(), "yyyy-MM-dd")
              : null;
            const currentDate = msg.timestamp
              ? format(msg.timestamp.toDate(), "yyyy-MM-dd")
              : null;
            const showDate = prevDate !== currentDate;

            const senderProfile = userProfiles[msg.senderId];
            const senderName = senderProfile?.nickname || "Unknown";
            const senderProfileImageUrl = senderProfile?.profileImageUrl;

            const canUnsend = msg.senderId === user?.uid && msg.timestamp &&
                              differenceInSeconds(currentTime, msg.timestamp.toDate()) < (24 * 60 * 60) &&
                              !msg.isUnsent;

            const canRestore = msg.senderId === user?.uid && msg.isUnsent;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center text-gray-400 text-xs my-2">
                    {msg.timestamp ? format(msg.timestamp.toDate(), "yyyy年MM月dd日 (E)", {
                      locale: ja,
                    }) : 'Invalid Date'}
                  </div>
                )}
                <div
                  className={`flex gap-3 ${
                    msg.senderId === user?.uid ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.senderId !== user?.uid && (
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={senderProfileImageUrl}
                          alt={senderName}
                        />
                        <AvatarFallback>
                          {senderName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {isUserOnline(msg.senderId) && (
                        <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-white" />
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[80%] min-w-0 ${msg.senderId === user?.uid ? "items-end" : "items-start"}`}>
                    {msg.senderId !== user?.uid && (
                      <div className="text-xs text-gray-500 mb-1 text-left">{senderName}</div>
                    )}

                    <div className={`flex items-end gap-1 ${msg.senderId === user?.uid ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`p-3 rounded-lg break-words ${
                          msg.senderId === user?.uid
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-gray-200 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        <MessageContent messageText={msg.messageText} isUnsent={msg.isUnsent} />
                      </div>
                      <div className={`flex flex-col items-${msg.senderId === user?.uid ? "end" : "start"} gap-1`}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMessage(msg.messageText)}
                            className="p-0 h-auto text-xs text-gray-500 hover:text-blue-500"
                          >
                            コピー
                          </Button>
                          {canUnsend && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnsendMessage(msg.id)}
                              className="p-0 h-auto text-xs text-gray-500 hover:text-red-500"
                            >
                              取消
                            </Button>
                          )}
                          {canRestore && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestoreMessage(msg.id)}
                              className="p-0 h-auto text-xs text-gray-500 hover:text-green-500"
                            >
                              復元
                            </Button>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap">
                          {msg.timestamp ? format(msg.timestamp.toDate(), "HH:mm", { locale: ja }) : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {msg.senderId === user?.uid && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={senderProfileImageUrl}
                        alt={senderName}
                      />
                      <AvatarFallback>
                        {senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 flex items-center gap-2 shadow-md">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="flex-1 min-h-[40px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          rows={1}
        />
        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
          <Send className="h-5 w-5" />
          <span className="sr-only">送信</span>
        </Button>
      </div>
    </div>
  );
}
