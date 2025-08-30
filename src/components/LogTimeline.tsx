// src/components/LogTimeline.tsx
// ユーザーのログ記録を時系列で表示するタイムラインコンポーネント。
// 依存: useLogbook (ログ操作フック), EditLogModal (ログ編集モーダル)

"use client";

import React, { useState } from "react"; // useState: 編集モーダルの開閉状態管理
import { Timestamp } from "firebase/firestore"; // Firestore Timestamp 型
import { Log, useLogbook } from "@/hooks/useLogbook"; // Log型・ログ操作フック
import { EditLogModal } from "@/components/EditLogModal"; // ログ編集用モーダル
import { Pet } from "@/hooks/usePets";

// Timestampオブジェクトを "HH:mm" 形式の文字列に変換する
// nullの場合は "--:--" を表示して未記録を表現
const formatTime = (timestamp: Timestamp | null): string => {
  if (!timestamp) {
    return "--:--";
  }
  return timestamp.toDate().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface LogTimelineProps {
  logs: Log[];
  selectedPet: Pet | null;
  title?: string; // タイトルをカスタマイズ可能
  emptyMessage?: string; // ログが空のときに表示するメッセージ
}

export const LogTimeline: React.FC<LogTimelineProps> = ({
  logs,
  selectedPet,
  title = "記録", // デフォルトタイトル
  emptyMessage = "まだ記録がありません。", // デフォルト空メッセージ
}) => {
  const { deleteLog, updateLog } = useLogbook(selectedPet?.id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 編集モーダルの開閉状態
  const [logToEdit, setLogToEdit] = useState<Log | null>(null); // 編集対象のログを保持

  // 編集ボタン押下時の処理
  const handleEdit = (log: Log) => {
    setLogToEdit(log); // 編集対象ログをセット
    setIsEditModalOpen(true); // モーダルを開く
  };

  // 削除ボタン押下時の処理
  const handleDelete = async (logId: string) => {
    if (!selectedPet) return;
    await deleteLog(logId);
  };

  // ログがない場合は空メッセージを表示
  if (logs.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // ログがある場合はタイムライン表示
  return (
    <div className="mt-6 w-full">
      {/* <h2 className="text-lg font-semibold mb-3 text-center border-b pb-2 text-white"> */}
      {/* {title} タイトル表示 */}
      {/* </h2> */}
      <ul className="space-y-2">
        {logs.map((log) => (
          <li
            key={log.id}
            className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <span className="font-mono text-base text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {formatTime(log.timestamp)} {/* ログ時刻をフォーマットして表示 */}
            </span>
            <span className="ml-4 font-medium text-gray-800 text-base">
              {log.taskName} {/* ログのタスク名 */}
            </span>
            {log.note && (
              <span className="ml-2 text-sm text-gray-500">
                ({log.note}) {/* メモがある場合に表示 */}
              </span>
            )}
            {/* 編集・削除ボタン */}
            <div className="ml-auto flex space-x-2">
              <button
                onClick={() => handleEdit(log)}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                編集
              </button>
              <button
                onClick={() => handleDelete(log.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                削除
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* 編集モーダル表示 */}
      <EditLogModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        logToEdit={logToEdit}
        selectedPet={selectedPet}
      />
    </div>
  );
};
