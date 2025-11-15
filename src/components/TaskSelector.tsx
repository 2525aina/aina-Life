"use client";

import { useTasks } from "@/hooks/useTasks";
import { useLogActions } from "@/hooks/useLogs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { ClipboardListIcon } from "lucide-react";
import { usePetSelection } from "@/contexts/PetSelectionContext";
import { useState, useEffect } from "react";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { MemoInput } from "./MemoInput";
import { CollapsibleSection } from "./CollapsibleSection";

import { useTaskLoggerSettings } from "@/hooks/useTaskLoggerSettings";

export function TaskSelector() {
  const { selectedPet } = usePetSelection();
  const { tasks, loading: tasksLoading } = useTasks(selectedPet?.id || "");
  const { addLog } = useLogActions();
  const { settings, loading: settingsLoading } = useTaskLoggerSettings();
  const [memo, setMemo] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const [isManuallySet, setIsManuallySet] = useState(false);

  useEffect(() => {
    if (isManuallySet) return;
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isManuallySet]);


  const handleReset = () => {
    setDateTime(new Date());
    setIsManuallySet(false);
  };

  const handleTaskClick = async (task: (typeof tasks)[0]) => {
    try {
      await addLog(task, dateTime, memo);
      toast.success(`ログを記録しました: ${task.name}`);
      setMemo("");
      setIsManuallySet(false);
      setDateTime(new Date());
    } catch (error) {
      console.error("ログの記録に失敗しました", error);
      toast.error("ログの記録に失敗しました。");
    }
  };

  if (tasksLoading || settingsLoading) {
    return <p>タスクをロード中...</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <ClipboardListIcon className="h-16 w-16 mb-4 text-gray-400" />
        <p className="text-lg font-semibold mb-2">
          記録するタスクがありません。
        </p>
        <Link href="/pets">
          <Button>タスクを作成する</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {settings?.showDateTime && (
        <CollapsibleSection title="日時" initialOpen={settings.initialDateTimeOpen}>
          <div className="flex items-center gap-2">
                      <div className="flex flex-nowrap items-center gap-2">
                        <DatePicker
                          selected={dateTime}
                          onChange={(date) => {
                            setDateTime(date || new Date());
                            setIsManuallySet(true);
                          }}
                          id="task-date-input"
                          name="task-date-input"
                          className="w-fit"
                        />
                        <TimePicker
                          selected={dateTime}
                          onChange={(date) => {
                            setDateTime(date || new Date());
                            setIsManuallySet(true);
                          }}
                          id="task-time-input"
                          name="task-time-input"
                          className="w-fit"
                        />
                        <Button variant="outline" onClick={handleReset}>リセット</Button>
                      </div>          </div>
        </CollapsibleSection>
      )}
      {settings?.showMemo && (
        <CollapsibleSection title="メモ" initialOpen={settings.initialMemoOpen}>
          <MemoInput memo={memo} setMemo={setMemo} />
        </CollapsibleSection>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        {tasks.map((task) => (
          <Button
            key={task.id}
            style={{ backgroundColor: task.color, color: task.textColor }}
            onClick={() => handleTaskClick(task)}
            className="max-w-[calc(100%-0.5rem)] truncate"
          >
            {task.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
