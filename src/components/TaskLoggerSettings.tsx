"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/lib/types";

interface TaskLoggerSettingsProps {
  taskLoggerSettings: UserProfile["settings"]["taskLogger"];
  onSettingsChange: (
    newSettings: Partial<UserProfile["settings"]["taskLogger"]>
  ) => void;
}

export function TaskLoggerSettings({
  taskLoggerSettings,
  onSettingsChange,
}: TaskLoggerSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>タスク記録画面の設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-datetime">日時の表示</Label>
          <Switch
            id="show-datetime"
            checked={taskLoggerSettings?.showDateTime}
            onCheckedChange={(checked) =>
              onSettingsChange({ showDateTime: checked })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-memo">メモの表示</Label>
          <Switch
            id="show-memo"
            checked={taskLoggerSettings?.showMemo}
            onCheckedChange={(checked) =>
              onSettingsChange({ showMemo: checked })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="initial-datetime-open">日時を最初から開く</Label>
          <Switch
            id="initial-datetime-open"
            checked={taskLoggerSettings?.initialDateTimeOpen}
            onCheckedChange={(checked) =>
              onSettingsChange({ initialDateTimeOpen: checked })
            }
            disabled={!taskLoggerSettings?.showDateTime}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="initial-memo-open">メモを最初から開く</Label>
          <Switch
            id="initial-memo-open"
            checked={taskLoggerSettings?.initialMemoOpen}
            onCheckedChange={(checked) =>
              onSettingsChange({ initialMemoOpen: checked })
            }
            disabled={!taskLoggerSettings?.showMemo}
          />
        </div>
      </CardContent>
    </Card>
  );
}
