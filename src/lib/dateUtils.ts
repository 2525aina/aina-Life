// src/lib/dateUtils.ts
// 日付関連のユーティリティ関数

/**
 * 2つの日付の間の期間を「X年Yヶ月Z日」の形式で計算します。
 * @param startDateString 開始日 (YYYY-MM-DD)
 * @param endDateString 終了日 (YYYY-MM-DD)
 * @returns {string} フォーマットされた期間の文字列
 */
export const calculatePeriod = (startDateString?: string, endDateString?: string): string => {
  if (!startDateString) {
    return '未設定';
  }

  const startDate = new Date(startDateString);
  const endDate = endDateString ? new Date(endDateString) : new Date();

  if (isNaN(startDate.getTime())) {
    return '日付が無効です';
  }

  let years = endDate.getFullYear() - startDate.getFullYear();
  let months = endDate.getMonth() - startDate.getMonth();
  let days = endDate.getDate() - startDate.getDate();

  if (days < 0) {
    // 前の月の最終日を取得して日数を計算
    const lastDayOfPreviousMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
    months--;
    days += lastDayOfPreviousMonth;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years}年`);
  if (months > 0) parts.push(`${months}ヶ月`);
  if (days > 0 || parts.length === 0) parts.push(`${days}日`); // 年月が0の場合は日数を表示

  return parts.join('');
};
