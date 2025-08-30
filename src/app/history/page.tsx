// src/app/history/page.tsx
// ユーザーのログ履歴ページコンポーネント。
// 日付ごとのログ表示、日付切替、今日への移動機能を提供。
// 依存: useLogbook, LogTimeline, Header, FooterNav

"use client"; // クライアントサイドで実行

import React, { useState } from "react";
import { Header } from "@/components/Header"; // 共通ヘッダー
import { FooterNav } from "@/components/FooterNav"; // 共通フッターナビ
import { useLogbook } from "@/hooks/useLogbook"; // ログデータ取得フック
import { LogTimeline } from "@/components/LogTimeline"; // ログタイムライン表示コンポーネント

// 日付を日本語表記でフォーマットするヘルパー関数
const formatDate = (date: Date) => {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date()); // 選択されている日付

  // 前日へ移動
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  // 翌日へ移動
  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // 今日の日付に戻す
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // 選択日付に基づくログデータを取得
  const { logs, loading } = useLogbook(selectedDate);

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header /> {/* 共通ヘッダー */}
      <main className="flex-grow w-full p-4 pb-16">
        <h1 className="text-3xl font-bold mb-4 text-white text-center">履歴</h1>

        {/* 日付切替用スイッチャー */}
        <div className="flex items-center justify-center mb-6 space-x-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600"
          >
            &lt; {/* 前日ボタン */}
          </button>
          <span className="text-xl font-semibold text-white">
            {formatDate(selectedDate)} {/* 選択日付表示 */}
          </span>
          <button
            onClick={goToNextDay}
            className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600"
          >
            &gt; {/* 翌日ボタン */}
          </button>
          <button
            onClick={goToToday}
            className="ml-4 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm"
          >
            今日 {/* 今日ボタン */}
          </button>
        </div>

        {/* ログ表示部分 */}
        {loading ? (
          <div className="text-center text-white">ログを読み込み中...</div>
        ) : (
          <LogTimeline
            logs={logs} // 日付に対応するログ配列
            title={`${formatDate(selectedDate)} の記録`} // タイトル
            emptyMessage="この日の記録はありません。" // ログが空の場合のメッセージ
          />
        )}
      </main>
      <FooterNav /> {/* 共通フッターナビ */}
    </div>
  );
}
