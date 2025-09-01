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
          <h1 className="text-3xl font-bold mb-4 text-white text-center">
            設定
          </h1>

          {/* ユーザー情報セクション */}
          <section className="bg-gray-700 p-4 rounded-lg shadow-md text-white mb-6">
            <h2 className="text-xl font-bold mb-2">ユーザー情報</h2>
            <p className="mb-1">
              <strong>名前:</strong> {user.displayName || "未設定"}
            </p>
            <p>
              <strong>メール:</strong> {user.email || "未設定"}
            </p>
            {/* TODO: プロフィール編集機能 */}
          </section>

          {/* 家族と共有機能セクション */}
          <section className="bg-gray-700 p-4 rounded-lg shadow-md text-white mb-6">
            <h2 className="text-xl font-bold mb-4">ペットの共有管理</h2>

            {/* ペット選択のUI（仮） */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">対象のペット</p>
              <div className="bg-gray-600 p-2 rounded-md">
                <p className="font-bold">ポチ</p> {/* TODO: 選択中のペット名に連携 */}
              </div>
            </div>

            {/* 共有メンバーリスト */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">共有中のメンバー</h3>
              <ul className="space-y-2">
                {/* Sample Member 1 */}
                <li className="flex items-center justify-between bg-gray-600 p-2 rounded-md">
                  <div>
                    <p className="font-medium">user1@example.com</p>
                    <p className="text-sm text-gray-400">役割: 閲覧者</p>
                  </div>
                  <button className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-md">
                    解除
                  </button>
                </li>
                {/* Sample Member 2 */}
                <li className="flex items-center justify-between bg-gray-600 p-2 rounded-md">
                  <div>
                    <p className="font-medium">user2@example.com</p>
                    <p className="text-sm text-gray-400">役割: 一般</p>
                  </div>
                  <button className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-md">
                    解除
                  </button>
                </li>
                 {/* TODO: メンバーリストを動的に表示 */}
              </ul>
            </div>

            {/* メンバー招待フォーム */}
            <div>
              <h3 className="text-lg font-semibold mb-2">新しいメンバーを招待</h3>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="招待するユーザーのメールアドレス"
                  className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                  招待
                </button>
              </div>
            </div>
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
