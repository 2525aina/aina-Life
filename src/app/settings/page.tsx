"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePetSelection } from "@/contexts/PetSelectionContext";
import { usePets, Member } from "@/hooks/usePets";
import { Header } from "@/components/Header";
import { FooterNav } from "@/components/FooterNav";
import LoginButton from "@/components/LoginButton";

export default function SettingsPage() {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const { selectedPet, pets, loading: petsLoading } = usePetSelection();
  const { getSharedMembers } = usePets();

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    if (selectedPet) {
      const fetchMembers = async () => {
        setLoadingMembers(true);
        const fetchedMembers = await getSharedMembers(selectedPet.id);
        // TODO: メンバーのemailなどを取得する処理
        setMembers(fetchedMembers);
        setLoadingMembers(false);
      };
      fetchMembers();
    } else {
      setMembers([]);
    }
  }, [selectedPet, getSharedMembers]);

  const loading = authLoading || petsLoading;

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
      <Header
        pets={pets}
        selectedPet={selectedPet}
        onPetChange={() => {}}
        loading={petsLoading}
      />
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
          </section>

          {/* 家族と共有機能セクション */}
          <section className="bg-gray-700 p-4 rounded-lg shadow-md text-white mb-6">
            <h2 className="text-xl font-bold mb-4">ペットの共有管理</h2>

            {selectedPet ? (
              <>
                {/* ペット選択のUI */}
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">対象のペット</p>
                  <div className="bg-gray-600 p-2 rounded-md">
                    <p className="font-bold">{selectedPet.name}</p>
                  </div>
                </div>

                {/* 共有メンバーリスト */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">共有中のメンバー</h3>
                  {loadingMembers ? (
                    <p>メンバーを読み込み中...</p>
                  ) : members.length > 0 ? (
                    <ul className="space-y-2">
                      {members.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center justify-between bg-gray-600 p-2 rounded-md"
                        >
                          <div>
                            <p className="font-medium">{member.id}</p> {/* TODO: email等に置き換え */}
                            <p className="text-sm text-gray-400">役割: {member.role}</p>
                          </div>
                          <button className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-md">
                            解除
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">このペットはまだ誰とも共有されていません。</p>
                  )}
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
              </>
            ) : (
              <p className="text-gray-400">共有設定を行うには、まずペットを登録・選択してください。</p>
            )}
          </section>

          {/* ログアウトボタン */}
          <div className="text-center mt-8">
            <button
              onClick={signOutUser}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md"
            >
              ログアウト
            </button>
          </div>
        </div>
      </main>
      <FooterNav />
    </div>
  );
}
