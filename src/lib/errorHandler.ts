/**
 * 共通エラーハンドリングユーティリティ
 * 
 * エラーメッセージの統一と開発者向けログを提供
 */
import { toast } from 'sonner';

/**
 * エラーコンテキスト情報
 */
interface ErrorContext {
    /** 機能名（ログ用） */
    context: string;
    /** ユーザー向けフォールバックメッセージ */
    fallbackMessage?: string;
    /** コンソールにログを出力するか */
    silent?: boolean;
}

/**
 * エラーから適切なメッセージを取得
 */
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return '';
}

/**
 * 共通エラーハンドラー
 * 
 * @example
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, { context: 'ProfileSave', fallbackMessage: 'プロフィールの保存に失敗しました' });
 * }
 */
export function handleError(
    error: unknown,
    { context, fallbackMessage = 'エラーが発生しました', silent = false }: ErrorContext
): void {
    // 開発者向けログ
    if (!silent) {
        console.error(`[${context}]`, error);
    }

    // ユーザー向けトースト
    const message = getErrorMessage(error) || fallbackMessage;
    toast.error(message);
}

/**
 * 操作別のプリセットエラーハンドラー
 */
export const errorHandlers = {
    /** 保存失敗 */
    save: (error: unknown, context: string) =>
        handleError(error, { context, fallbackMessage: '保存に失敗しました' }),

    /** 削除失敗 */
    delete: (error: unknown, context: string) =>
        handleError(error, { context, fallbackMessage: '削除に失敗しました' }),

    /** 読み込み失敗 */
    load: (error: unknown, context: string) =>
        handleError(error, { context, fallbackMessage: '読み込みに失敗しました' }),

    /** アップロード失敗 */
    upload: (error: unknown, context: string) =>
        handleError(error, { context, fallbackMessage: 'アップロードに失敗しました' }),

    /** 更新失敗 */
    update: (error: unknown, context: string) =>
        handleError(error, { context, fallbackMessage: '更新に失敗しました' }),

    /** 登録失敗 */
    create: (error: unknown, context: string) =>
        handleError(error, { context, fallbackMessage: '登録に失敗しました' }),
};
