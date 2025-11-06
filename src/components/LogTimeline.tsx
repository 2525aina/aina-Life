"use client";

import { useState } from "react";
import { usePetSelection } from "@/contexts/PetSelectionContext";
import { useLogs, useLogActions } from "@/hooks/useLogs";
import type { Log } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  ClipboardListIcon,
  PawPrintIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";


import { cn } from "@/lib/utils";
import { LogFormModal } from "@/components/LogFormModal";

interface LogTimelineProps {
  targetDate: Date;
  timeFormat?: 'HH:mm:ss' | 'H:m:s' | 'HH:mm' | 'H:m';
}

export function LogTimeline({ targetDate, timeFormat = "HH:mm:ss" }: LogTimelineProps) {
  const { selectedPet } = usePetSelection();
  const { logs } = useLogs(targetDate);
  const { deleteLog } = useLogActions();
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [logToEdit, setLogToEdit] = useState<Log | null>(null);

  const emptyMessageText = "この日の記録はありません。";

  const handleAddLog = () => {
    setLogToEdit(null);
    setIsLogFormOpen(true);
  };

  const handleEditLog = (log: Log) => {
    setLogToEdit(log);
    setIsLogFormOpen(true);
  };

  if (!selectedPet) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <PawPrintIcon className="h-16 w-16 mb-4 text-gray-400" />
        <p className="text-lg font-semibold mb-2">
          ログを表示するには、まずペットを選択してください。
        </p>
        <p className="text-md">
          ペットが登録されていない場合は、ペット管理画面から追加してください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddLog}>手動でログを追加</Button>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <ClipboardListIcon className="h-16 w-16 mb-4 text-gray-400" />
          <p className="text-lg font-semibold mb-2">{emptyMessageText}</p>
          <p className="text-md">
            手動でログを追加するか、タスクを実行して記録しましょう！
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className={cn(
                "flex items-center p-3 rounded-lg shadow-sm border transition-colors",
                log.isTaskDeleted
                  ? "bg-gray-200 opacity-60 border-gray-300"
                  : "bg-white border-gray-100 hover:bg-gray-50"
              )}
              style={{
                backgroundColor: log.isTaskDeleted ? undefined : log.taskColor,
                color: log.isTaskDeleted ? undefined : log.taskTextColor,
              }}
            >
              <div className="flex flex-col items-center">
                {/* 作成者/更新者名 */}
                {(() => {
                  const primaryName = log.createdByName || "unknown";
                  const truncatedPrimaryName = primaryName.substring(0, 6);
                  return (
                    <span
                      className="font-mono text-sm mb-1 px-2 py-1 rounded"
                      style={{
                        backgroundColor: log.creatorNameBgColor,
                        color: log.creatorNameTextColor,
                      }}
                    >
                      {truncatedPrimaryName}
                      {log.updatedByName &&
                        log.createdByName !== log.createdByName && (
                          <span> (更新者: {log.updatedByName})</span>
                        )}
                    </span>
                  );
                })()}
                {/* 時刻表示 */}
                <span
                  className="font-mono text-sm px-2 py-1 rounded"
                  style={{
                    backgroundColor: log.timeBgColor,
                    color: log.timeTextColor,
                  }}
                >
                  {format(log.timestamp.toDate(), timeFormat, { locale: ja })}
                </span>{" "}
              </div>
              <span
                className="ml-1 font-medium text-base break-all block overflow-y-auto"
                style={{
                  color: log.taskTextColor,
                  maxHeight: "3rem",
                  minWidth: "12px",
                }}
              >
                {log.taskName}
              </span>
              {log.note && (
                <span
                  className="ml-1 text-sm break-all block overflow-y-auto"
                  style={{ color: log.taskTextColor, maxHeight: "3rem" }}
                >
                  ({log.note})
                </span>
              )}
              <div className="ml-auto flex space-x-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleEditLog(log)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteLog(log.id)}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isLogFormOpen && (
        <LogFormModal
          isOpen={isLogFormOpen}
          onClose={() => setIsLogFormOpen(false)}
          logToEdit={logToEdit}
          initialDate={targetDate}
        />
      )}
    </div>
  );
}
