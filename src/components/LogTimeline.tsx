// src/components/LogTimeline.tsx
'use client';

import React, { useState } from 'react'; // useStateを追加
import { Timestamp } from 'firebase/firestore';
import { Log, useLogbook } from '@/hooks/useLogbook'; // LogインターフェースとuseLogbookをインポート
import { EditLogModal } from '@/components/EditLogModal'; // EditLogModalをインポート

// Timestampオブジェクトを "HH:mm" 形式の文字列にフォーマットするヘルパー関数
const formatTime = (timestamp: Timestamp | null): string => {
  if (!timestamp) {
    return '--:--';
  }
  // toDate()でJavaScriptのDateオブジェクトに変換してからフォーマット
  return timestamp.toDate().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface LogTimelineProps {
  logs: Log[];
  title?: string; // タイトルをカスタマイズできるように追加
  emptyMessage?: string; // ログがない場合のメッセージをカスタマイズできるように追加
}

export const LogTimeline: React.FC<LogTimelineProps> = ({
  logs,
  title = '記録', // デフォルトタイトル
  emptyMessage = 'まだ記録がありません。', // デフォルトメッセージ
}) => {
  const { deleteLog } = useLogbook();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // 編集モーダルの開閉状態
  const [logToEdit, setLogToEdit] = useState<Log | null>(null); // 編集対象のログ

  const handleEdit = (log: Log) => {
    setLogToEdit(log);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (logId: string) => {
    await deleteLog(logId);
  };

  // ログがまだない場合の表示
  if (logs.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // ログがある場合のタイムライン表示
  return (
    <div className="mt-6 w-full">
      <h2 className="text-lg font-semibold mb-3 text-center border-b pb-2 text-white">
        {title}
      </h2>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li
            key={log.id}
            className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <span className="font-mono text-base text-gray-700 bg-gray-100 px-2 py-1 rounded">
              {formatTime(log.timestamp)}
            </span>
            <span className="ml-4 font-medium text-gray-800 text-base">
              {log.taskName}
            </span>
            {log.note && ( // メモがあれば表示
              <span className="ml-2 text-sm text-gray-500">
                ({log.note})
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

      <EditLogModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        logToEdit={logToEdit}
      />
    </div>
  );
};
