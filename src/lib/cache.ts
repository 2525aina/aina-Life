/**
 * セッションベースのキャッシュユーティリティ
 * 
 * タブを閉じるとクリアされるsessionStorageを使用
 * 初期データロードを高速化しつつ、onSnapshotでリアルタイム更新を維持
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_PREFIX = 'aina_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5分

/**
 * キャッシュからデータを取得
 */
export function getCache<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
        const cached = sessionStorage.getItem(CACHE_PREFIX + key);
        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);

        // TTLチェック
        if (Date.now() - entry.timestamp > DEFAULT_TTL) {
            sessionStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }

        return entry.data;
    } catch {
        return null;
    }
}

/**
 * キャッシュにデータを保存
 */
export function setCache<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;

    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
        };
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
        // sessionStorageがいっぱいの場合は古いキャッシュをクリア
        console.warn('[Cache] Storage full, clearing old entries');
        clearOldCache();
    }
}

/**
 * 特定のキャッシュを削除
 */
export function removeCache(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * パターンにマッチするキャッシュを削除
 */
export function invalidateCachePattern(pattern: string): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
}

/**
 * 全キャッシュをクリア
 */
export function clearAllCache(): void {
    if (typeof window === 'undefined') return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
}

/**
 * 古いキャッシュエントリを削除
 */
function clearOldCache(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) {
            try {
                const entry = JSON.parse(sessionStorage.getItem(key) || '{}');
                if (Date.now() - entry.timestamp > DEFAULT_TTL) {
                    keysToRemove.push(key);
                }
            } catch {
                keysToRemove.push(key);
            }
        }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
}

/**
 * キャッシュキー生成ヘルパー
 */
export const cacheKeys = {
    pets: (userId: string) => `pets_${userId}`,
    friends: (petId: string) => `friends_${petId}`,
    weights: (petId: string) => `weights_${petId}`,
    entries: (petId: string, month: string) => `entries_${petId}_${month}`,
    tasks: (petId: string) => `tasks_${petId}`,
};
