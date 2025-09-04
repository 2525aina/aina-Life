// src/app/page.tsx
// アプリのメインページ。
// 認証状態に応じてログイン画面またはダッシュボードを表示する。
// 依存: useAuth, useLogbook, 各種UIコンポーネント

"use client"; // このコンポーネントはクライアントサイドで実行される

// React関連
import { useState, useEffect } from "react"; // コンポーネント内で状態管理に使用

// 認証・データ取得フック
import { useAuth } from "@/hooks/useAuth"; // 認証状態とユーザー情報を管理
import { useLogbook } from "@/hooks/useLogbook"; // ログデータを管理
import { usePetSelection } from "@/contexts/PetSelectionContext"; // グローバルなペット選択状態

// UIコンポーネント
import LoginButton from "@/components/LoginButton"; // ログイン開始ボタン
import UserProfile from "@/components/UserProfile"; // ユーザー情報を表示
import { TaskSelector } from "@/components/TaskSelector"; // タスク選択UI
import { LogTimeline } from "@/components/LogTimeline"; // ユーザーのログ履歴を表示
import { Header } from "@/components/Header"; // 画面上部の共通ヘッダー
import { FooterNav } from "@/components/FooterNav"; // 画面下部のナビゲーションバー
import { QuickAddButton } from "@/components/QuickAddButton"; // ログを即時追加するボタン
import { ManualAddLogModal } from "@/components/ManualAddLogModal"; // 手動でログを追加するモーダル

// メインページの定義
export default function Home() {
  // 認証フックからユーザー情報とローディング状態を取得
  const { user, loading: authLoading } = useAuth();
  // グローバルなペット選択状態を取得
  const {
    pets,
    selectedPet,
    setSelectedPet,
    loading: petsLoading,
  } = usePetSelection();

  // モーダルの開閉状態を管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logTimeInput, setLogTimeInput] = useState(""); // リアルタイム時刻入力用
  const [memoInput, setMemoInput] = useState(""); // メモ入力用
  const [isManualTimeEdit, setIsManualTimeEdit] = useState(false); // 時刻の手動編集フラグ

  // ログブックからユーザーのログデータを取得
  const { logs, addLog } = useLogbook(selectedPet?.id);

  // 全体のローディング状態
  const loading = authLoading || petsLoading;

  // リアルタイム時刻表示のuseEffect
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      // datetime-local形式: YYYY-MM-DDTHH:MM:SS
      const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

      if (!isManualTimeEdit) {
        setLogTimeInput(formattedTime);
      }
    };

    updateCurrentTime(); // 初期表示
    const timerId = setInterval(updateCurrentTime, 1000); // 1秒ごとに更新

    return () => clearInterval(timerId); // クリーンアップ
  }, [isManualTimeEdit]);

  // 認証状態の判定が終わるまで「読み込み中」を表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  const handleLogTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualTimeEdit(true);
    setLogTimeInput(e.target.value);
  };

  const handleLogTimeBlur = () => {
    if (!logTimeInput) {
      setIsManualTimeEdit(false);
      // Blur時に空なら現在時刻に戻す
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setLogTimeInput(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
    }
  };

  const handleResetTime = () => {
    setIsManualTimeEdit(false);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    setLogTimeInput(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      {user && ( // 条件付きレンダリングヘッダー
        <Header
          pets={pets}
          selectedPet={selectedPet}
          onPetChange={setSelectedPet}
          loading={petsLoading}
        />
      )}
      <main className="flex-grow w-full pb-16">
        {user ? (
          // 認証済みの場合：ダッシュボードを表示
          <>
            <div className="max-w-7xl mx-auto p-4 space-y-4">
              {/* <UserProfile /> ユーザー情報 */}
              <TaskSelector
                selectedPet={selectedPet}
                addLog={addLog}
                logTimeInput={logTimeInput}
                memoInput={memoInput}
              />
              {/* タスク選択 */}
              {/* 日付時刻とメモの入力欄 */}
              <div className="bg-gray-700 p-4 rounded-lg shadow-md text-white flex flex-col md:flex-row gap-4">
                <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <label
                      htmlFor="logTime"
                      className="block text-sm font-medium text-gray-300"
                    >
                      時刻
                    </label>
                    <input
                      type="datetime-local"
                      id="logTime"
                      value={logTimeInput}
                      onChange={handleLogTimeChange}
                      onBlur={handleLogTimeBlur}
                      className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <button
                      onClick={handleResetTime}
                      className="px-2 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-medium mt-6"
                      title="現在時刻にリセット"
                    >
                      リセット
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="memo"
                    className="block text-sm font-medium text-gray-300"
                  >
                    メモ (任意)
                  </label>
                  <textarea
                    id="memo"
                    value={memoInput}
                    onChange={(e) => setMemoInput(e.target.value)}
                    rows={1} // Adjust rows for better visibility in horizontal layout
                    className="mt-1 block w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: ご飯を完食しました"
                  ></textarea>
                </div>
              </div>
              <LogTimeline logs={logs} selectedPet={selectedPet} />
            </div>
            <QuickAddButton onClick={() => setIsModalOpen(true)} />
            {/* 新規ログ追加ボタン */}
            <ManualAddLogModal
              isOpen={isModalOpen} // 開閉状態
              onClose={() => setIsModalOpen(false)} // 閉じる処理
              selectedPet={selectedPet}
            />
          </>
        ) : (
          // 未認証の場合：ログイン画面を表示
          <div className="min-h-full flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold mb-8">aina Life アプリ</h1>
            <LoginButton /> {/* ログインボタン */}
          </div>
        )}
      </main>
      {user && <FooterNav />} {/* 条件付きでFooterNavをレンダリングします */}
    </div>
  );
}
