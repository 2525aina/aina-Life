// src/components/TaskSelector.tsx
// タスク一覧から選択して記録できるUIコンポーネント。
// 依存: useLogbook（タスク一覧・記録処理を提供）

"use client";

import { useLogbook } from "@/hooks/useLogbook"; // タスク一覧やログ追加処理を扱うカスタムフック

export const TaskSelector = () => {
  const { tasks, loading, addLog } = useLogbook(); // タスク一覧・ロード状態・記録追加処理を取得

  // 読み込み中はユーザーにローディング表示を出す
  if (loading) {
    return <div className="text-center p-4">タスクを読み込み中...</div>;
  }

  // タスクが未登録の場合は案内メッセージを表示する
  if (tasks.length === 0) {
    return (
      <div className="text-center p-4">
        <p>記録できるタスクがありません。</p>
        <p className="text-sm text-gray-500">
          設定画面からタスクを追加してください。
        </p>
      </div>
    );
  }

  // タスクをボタンとして並べ、クリックで記録を追加する
  return (
    <div className="flex flex-wrap justify-center gap-3 p-4 border-t border-b border-gray-200 my-4">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => addLog(task)} // 選択されたタスクを記録する
          className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-2 px-5 rounded-full shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105"
          style={{
            backgroundColor: task.color,
            color: task.textColor || "white",
          }} // タスクごとの色設定を適用
        >
          {task.name}
        </button>
      ))}
    </div>
  );
};
