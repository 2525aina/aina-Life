"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { FooterNav } from "@/components/FooterNav";
import LoginButton from "@/components/LoginButton";

export default function SettingsPage() {
  const { user, loading, signOutUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-8">ログインが必要です</h1>
        <p className="mb-4">このページを表示するにはログインしてください。</p>
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      {user && (
        <Header
          pets={[]} // Settings page doesn't need pets in header
          selectedPet={null}
          onPetChange={() => {}}
          loading={false}
        />
      )}
      <main className="flex-grow w-full p-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-white text-center">設定</h1>
          
          {/* ユーザー情報セクション */}
          <section className="bg-gray-700 p-4 rounded-lg shadow-md text-white mb-6">
            <h2 className="text-xl font-bold mb-2">ユーザー情報</h2>
            <p className="mb-1"><strong>名前:</strong> {user.displayName || '未設定'}</p>
            <p><strong>メール:</strong> {user.email || '未設定'}</p>
            {/* TODO: プロフィール編集機能 */}
          </section>

          {/* 家族と共有機能セクション (プレースホルダー) */}
          <section className="bg-gray-700 p-4 rounded-lg shadow-md text-white mb-6">
            <h2 className="text-xl font-bold mb-2">家族と共有</h2>
            <p className="text-gray-400">ペットの共有設定をここで行います。</p>
            {/* TODO: 共有管理UI */}
          </section>

          {/* ログアウトボタン */}
          <div className="text-center mt-8">
            <button
              onClick={signOutUser} // useAuthからsignOutUserを呼び出す
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md"
            >
              ログアウト
            </button>
          </div>
        </div>
      </main>
      {user && <FooterNav />} 
    </div>
  );
}
