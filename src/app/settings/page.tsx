"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePetSelection } from "@/contexts/PetSelectionContext";
import { usePets, Member, PendingInvitation } from "@/hooks/usePets";
import { Header } from "@/components/Header";
import { FooterNav } from "@/components/FooterNav";
import LoginButton from "@/components/LoginButton";

export default function SettingsPage() {
  const { user, loading: authLoading, signOutUser } = useAuth();
  const { selectedPet, setSelectedPet, pets, loading: petsLoading } = usePetSelection();
  const { getSharedMembers, inviteMember, getPendingInvitations, updateInvitationStatus } = usePets();

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (selectedPet) {
      setLoadingMembers(true);
      const fetchedMembers = await getSharedMembers(selectedPet.id);
      setMembers(fetchedMembers);
      setLoadingMembers(false);
    }
  }, [selectedPet, getSharedMembers]);

  useEffect(() => {
    if (selectedPet) {
      fetchMembers();
    }
  }, [selectedPet, fetchMembers]);

  const fetchPendingInvites = useCallback(async () => {
    setLoadingInvites(true);
    const invites = await getPendingInvitations();
    setPendingInvites(invites);
    setLoadingInvites(false);
  }, [getPendingInvitations]);

  useEffect(() => {
    fetchPendingInvites();
  }, [fetchPendingInvites]);

  const handleInvite = async () => {
    if (!selectedPet) {
      toast.error("招待するペットを選択してください。");
      return;
    }
    if (!inviteEmail) {
      toast.error("招待するユーザーのメールアドレスを入力してください。");
      return;
    }

    setIsInviting(true);
    try {
      await inviteMember(selectedPet.id, inviteEmail);
      toast.success(`${inviteEmail}さんを招待しました。`);
      setInviteEmail("");
      fetchMembers();
      fetchPendingInvites(); // 招待後に保留中の招待も更新
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleInvitationResponse = async (petId: string, memberId: string, status: 'active' | 'declined') => {
    try {
      await updateInvitationStatus(petId, memberId, status);
      toast.success(`招待を${status === 'active' ? '承諾' : '拒否'}しました。`);
      fetchPendingInvites(); // 招待リストを更新
      fetchMembers(); // 共有メンバーリストも更新
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  const loading = authLoading || petsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>
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
      <Header pets={pets} selectedPet={selectedPet} onPetChange={setSelectedPet} loading={petsLoading} />
      <main className="flex-grow w-full p-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-white text-center">設定</h1>

          {/* 保留中の招待セクション */}
          {loadingInvites ? (
            <p>招待を読み込み中...</p>
          ) : pendingInvites.length > 0 ? (
            <section className="bg-yellow-800 bg-opacity-50 p-4 rounded-lg shadow-md text-white mb-6">
              <h2 className="text-xl font-bold mb-4">保留中の招待</h2>
              <ul className="space-y-3">
                {pendingInvites.map(invite => (
                  <li key={invite.memberId} className="bg-gray-700 p-3 rounded-md flex items-center justify-between">
                    <div>
                      <p><strong>{invite.pet.name}</strong>への招待が届いています。</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleInvitationResponse(invite.pet.id, invite.memberId, 'active')}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-sm"
                      >承諾</button>
                      <button
                        onClick={() => handleInvitationResponse(invite.pet.id, invite.memberId, 'declined')}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm"
                      >拒否</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-gray-400">保留中の招待はありません。</p>
          )}

          {/* ユーザー情報セクション */}
          <section className="bg-gray-700 p-4 rounded-lg shadow-md text-white mb-6">
            <h2 className="text-xl font-bold mb-2">ユーザー情報</h2>
            <p className="mb-1"><strong>名前:</strong> {user.displayName || "未設定"}</p>
            <p><strong>メール:</strong> {user.email || "未設定"}</p>
          </section>

          {/* 家族と共有機能セクション */}
          <section className="bg-gray-700 p-4 rounded-lg shadow-md text-white mb-6">
            <h2 className="text-xl font-bold mb-4">ペットの共有管理</h2>
            {selectedPet ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-1">対象のペット</p>
                  <div className="bg-gray-600 p-2 rounded-md"><p className="font-bold">{selectedPet.name}</p></div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">共有中のメンバー</h3>
                  {loadingMembers ? (
                    <p>メンバーを読み込み中...</p>
                  ) : members.length > 0 ? (
                    <ul className="space-y-2">
                      {members.map((member) => (
                        <li key={member.id} className="flex items-center justify-between bg-gray-600 p-2 rounded-md">
                          <div>
                            <p className="font-medium">{member.inviteEmail || member.id}</p>
                            <p className="text-sm text-gray-400">役割: {member.role} ({member.status})</p>
                          </div>
                          <button className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-md">解除</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">このペットはまだ誰とも共有されていません。</p>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">新しいメンバーを招待</h3>
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="招待するユーザーのメールアドレス"
                      className="flex-grow bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isInviting}
                    />
                    <button onClick={handleInvite} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-500" disabled={isInviting}>
                      {isInviting ? "招待中..." : "招待"}
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
            <button onClick={signOutUser} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">ログアウト</button>
          </div>
        </div>
      </main>
      <FooterNav />
    </div>
  );
}