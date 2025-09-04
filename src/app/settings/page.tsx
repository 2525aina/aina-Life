"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePetSelection } from "@/contexts/PetSelectionContext";
import { usePets, Member, PendingInvitation } from "@/hooks/usePets";
import { Header } from "@/components/Header";
import { FooterNav } from "@/components/FooterNav";
import LoginButton from "@/components/LoginButton";
import { UserProfileEditForm } from "@/components/UserProfileEditForm"; // Import the new component
import { PetSharingManagement } from "@/components/PetSharingManagement"; // Import the new component

export default function SettingsPage() {
  const {
    user,
    firestoreUser,
    loading: authLoading,
    signOutUser,
    updateFirestoreUser,
  } = useAuth(); // Destructure firestoreUser and updateFirestoreUser
  const {
    selectedPet,
    setSelectedPet,
    pets,
    loading: petsLoading,
  } = usePetSelection();
  const {
    getPendingInvitations,
    updateInvitationStatus,
  } = usePets();

  const [pendingInvites, setPendingInvites] = useState<PendingInvitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  useEffect(() => {
    setLoadingInvites(true);
    const unsubscribe = getPendingInvitations((invites) => {
      setPendingInvites(invites);
      setLoadingInvites(false);
    });
    return () => unsubscribe();
  }, [getPendingInvitations]);

  const handleInvitationResponse = async (
    petId: string,
    memberId: string,
    status: "active" | "declined"
  ) => {
    try {
      await updateInvitationStatus(petId, memberId, status);
      toast.success(`招待を${status === "active" ? "承諾" : "拒否"}しました。`);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    }
  };

  const loading = authLoading || petsLoading;

  if (loading || !firestoreUser) {
    // Add firestoreUser to loading check
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-white">
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
        onPetChange={setSelectedPet}
        loading={petsLoading}
      />
      <main className="flex-grow w-full p-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-white text-center">
            設定
          </h1>

          {/* 保留中の招待セクション */}
          {loadingInvites ? (
            <p>招待を読み込み中...</p>
          ) : pendingInvites.length > 0 ? (
            <section className="bg-yellow-800 bg-opacity-50 p-4 rounded-lg shadow-md text-white mb-6">
              <h2 className="text-xl font-bold mb-4">保留中の招待</h2>
              <ul className="space-y-3">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.memberId}
                    className="bg-gray-700 p-3 rounded-md flex items-center justify-between"
                  >
                    <div>
                      <p>
                        <strong>{invite.pet.name}</strong>
                        への招待が届いています。
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleInvitationResponse(
                            invite.pet.id,
                            invite.memberId,
                            "active"
                          )
                        }
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-sm"
                      >
                        承諾
                      </button>
                      <button
                        onClick={() =>
                          handleInvitationResponse(
                            invite.pet.id,
                            invite.memberId,
                            "declined"
                          )
                        }
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md text-sm"
                      >
                        拒否
                      </button>
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
            <UserProfileEditForm
              currentUser={user}
              firestoreUser={firestoreUser}
              pets={pets}
              onSave={updateFirestoreUser}
            />
          </section>

          {/* 家族と共有機能セクション */}
          <PetSharingManagement />

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
