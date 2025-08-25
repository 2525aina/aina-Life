'use client';

import React from 'react';
import Link from 'next/link';

export const FooterNav = () => {
  return (
    <footer className="w-full p-4 bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <nav className="max-w-lg mx-auto flex justify-around items-center text-sm font-medium">
        <Link href="/" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
          <span>🏠</span>
          <span>ホーム</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
          <span>📚</span>
          <span>履歴</span>
        </Link>
        <Link href="/settings/tasks" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
          <span>📝</span>
          <span>タスク</span>
        </Link>
        <Link href="/pets" className="flex flex-col items-center text-gray-600 hover:text-blue-600">
          <span>🐾</span>
          <span>ペット</span>
        </Link>
      </nav>
    </footer>
  );
};
