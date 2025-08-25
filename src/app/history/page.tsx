'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { useLogbook } from '@/hooks/useLogbook'; // useLogbookをインポート
import { LogTimeline } from '@/components/LogTimeline'; // LogTimelineをインポート

// 日付を表示用にフォーマットするヘルパー関数
const formatDate = (date: Date) => {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date()); // 選択された日付の状態

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // useLogbookフックをselectedDateを引数に呼び出す
  const { logs, loading } = useLogbook(selectedDate);

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      <Header />
      <main className="flex-grow w-full p-4 pb-16">
        <h1 className="text-3xl font-bold mb-4 text-white text-center">履歴</h1>

        {/* 日付スイッチャー */}
        <div className="flex items-center justify-center mb-6 space-x-2">
          <button onClick={goToPreviousDay} className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600">
            &lt;
          </button>
          <span className="text-xl font-semibold text-white">
            {formatDate(selectedDate)}
          </span>
          <button onClick={goToNextDay} className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600">
            &gt;
          </button>
          <button onClick={goToToday} className="ml-4 px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm">
            今日
          </button>
        </div>

        {/* ログ表示 */}
        {loading ? (
          <div className="text-center text-white">ログを読み込み中...</div>
        ) : (
          <LogTimeline logs={logs} title={`${formatDate(selectedDate)} の記録`} emptyMessage="この日の記録はありません。" />
        )}
      </main>
      <FooterNav />
    </div>
  );
}
