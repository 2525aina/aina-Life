// src/components/LogTimeline.tsx
'use client';

import { useLogbook } from '@/hooks/useLogbook';
import { Timestamp } from 'firebase/firestore';

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

export const LogTimeline = () => {
  // useLogbookフックからログのリストを取得
  const { logs } = useLogbook();

  // ログがまだない場合の表示
  if (logs.length === 0) {
    return (
      <div className="mt-8 text-center text-gray-500">
        <p>今日の記録はまだありません。</p>
        <p className="text-sm">上のボタンから最初のログを記録してみましょう！</p>
      </div>
    );
  }

  // ログがある場合のタイムライン表示
  return (
    <div className="mt-6 w-full">
      <h2 className="text-lg font-semibold mb-3 text-center border-b pb-2">今日の記録</h2>
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
          </li>
        ))}
      </ul>
    </div>
  );
};
