// src/components/TaskSelector.tsx
'use client';

import { useLogbook } from '@/hooks/useLogbook';

export const TaskSelector = () => {
  const { tasks, loading, addLog } = useLogbook();

  // ローディング中の表示
  if (loading) {
    return <div className="text-center p-4">タスクを読み込み中...</div>;
  }

  // タスクが一つもない場合の表示
  if (tasks.length === 0) {
    return (
      <div className="text-center p-4">
        <p>記録できるタスクがありません。</p>
        <p className="text-sm text-gray-500">設定画面からタスクを追加してください。</p>
      </div>
    );
  }

  // タスクボタンの一覧表示
  return (
    <div className="flex flex-wrap justify-center gap-3 p-4 border-t border-b border-gray-200 my-4">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => addLog(task)}
          className="bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-2 px-5 rounded-full shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105"
          // TODO: 将来的に、task.colorを使ってボタンの色を動的に変更する
          // style={{ backgroundColor: task.color }}
        >
          {task.name}
        </button>
      ))}
    </div>
  );
};
