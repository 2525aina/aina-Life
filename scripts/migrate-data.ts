/**
 * 旧データ移行スクリプト
 * aina-life-dev (旧) → aina-life (新) へのデータ移行
 * 
 * 実行方法:
 * 1. Firebase Admin SDK の認証情報を取得
 * 2. 環境変数を設定
 * 3. npx ts-node scripts/migrate-data.ts
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Firebase Admin 初期化（環境変数から認証情報を読み込み）
// 本番実行時は適切な認証情報を設定してください
const sourceApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'aina-life-dev', // 旧プロジェクト
}, 'source');

const targetApp = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'aina-life', // 新プロジェクト
}, 'target');

const sourceDb = admin.firestore(sourceApp);
const targetDb = admin.firestore(targetApp);

// タスク名からエントリータグへのマッピング
const TASK_TO_TAG_MAP: Record<string, string[]> = {
    'ごはん': ['ごはん'],
    '食事': ['ごはん'],
    'フード': ['ごはん'],
    'おさんぽ': ['散歩'],
    '散歩': ['散歩'],
    'ウォーキング': ['散歩'],
    'お薬': ['お薬'],
    '薬': ['お薬'],
    '服薬': ['お薬'],
    '通院': ['通院'],
    '病院': ['通院'],
    '体調不良': ['体調不良'],
    '具合悪い': ['体調不良'],
    '睡眠': ['睡眠'],
    '寝た': ['睡眠'],
    '排泄': ['排泄'],
    'うんち': ['排泄'],
    'おしっこ': ['排泄'],
    'トリミング': ['トリミング'],
    'シャンプー': ['トリミング'],
    '予防接種': ['予防接種'],
    'ワクチン': ['予防接種'],
};

function mapTaskNameToTags(taskName: string): string[] {
    const normalizedName = taskName.toLowerCase();
    for (const [key, tags] of Object.entries(TASK_TO_TAG_MAP)) {
        if (normalizedName.includes(key.toLowerCase())) {
            return tags;
        }
    }
    return ['その他'];
}

async function migrateUsers() {
    console.log('📦 ユーザーデータの移行を開始...');

    const usersSnapshot = await sourceDb.collection('users').get();
    let count = 0;

    for (const doc of usersSnapshot.docs) {
        const data = doc.data();

        const newUser = {
            displayName: data.nickname || data.authName || 'ユーザー',
            avatarUrl: data.profileImageUrl || null,
            email: data.authEmail || null,
            settings: {
                theme: data.settings?.theme || 'system',
            },
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now(),
            // 旧データへの参照を保持
            migratedFrom: 'aina-life-dev',
            migratedAt: Timestamp.now(),
        };

        // null/undefined を除外
        const cleanUser = Object.fromEntries(
            Object.entries(newUser).filter(([_, v]) => v !== null && v !== undefined)
        );

        await targetDb.collection('users').doc(doc.id).set(cleanUser);
        count++;
    }

    console.log(`✅ ユーザー: ${count}件 移行完了`);
}

async function migratePets() {
    console.log('🐾 ペットデータの移行を開始...');

    const petsSnapshot = await sourceDb.collection('pets').get();
    let petCount = 0;
    let memberCount = 0;

    for (const petDoc of petsSnapshot.docs) {
        const petData = petDoc.data();

        // 削除済みはスキップ
        if (petData.deleted) continue;

        const newPet = {
            name: petData.name,
            breed: petData.breed || null,
            birthday: petData.birthday || null,
            avatarUrl: petData.profileImageUrl || null,
            ownerId: '', // メンバーから取得
            createdAt: petData.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now(),
            migratedFrom: 'aina-life-dev',
            migratedAt: Timestamp.now(),
        };

        // メンバーを移行
        const membersSnapshot = await sourceDb.collection('pets').doc(petDoc.id).collection('members').get();
        let ownerId = '';

        for (const memberDoc of membersSnapshot.docs) {
            const memberData = memberDoc.data();

            // アクティブなメンバーのみ移行
            if (memberData.status !== 'active' && memberData.status !== 'pending') continue;

            // オーナーを特定
            if (memberData.role === 'owner') {
                ownerId = memberData.uid;
            }

            const newMember = {
                userId: memberData.uid || '',
                role: memberData.role === 'owner' ? 'owner' : 'member',
                inviteEmail: memberData.inviteEmail?.toLowerCase() || null,
                status: memberData.status,
                createdAt: memberData.createdAt || Timestamp.now(),
            };

            const cleanMember = Object.fromEntries(
                Object.entries(newMember).filter(([_, v]) => v !== null && v !== undefined)
            );

            await targetDb.collection('pets').doc(petDoc.id).collection('members').doc(memberData.uid || memberDoc.id).set(cleanMember);
            memberCount++;
        }

        newPet.ownerId = ownerId;

        const cleanPet = Object.fromEntries(
            Object.entries(newPet).filter(([_, v]) => v !== null && v !== undefined)
        );

        await targetDb.collection('pets').doc(petDoc.id).set(cleanPet);
        petCount++;
    }

    console.log(`✅ ペット: ${petCount}件, メンバー: ${memberCount}件 移行完了`);
}

async function migrateLogs() {
    console.log('📝 ログデータ（日記エントリー）の移行を開始...');

    const logsSnapshot = await sourceDb.collectionGroup('logs').get();
    let count = 0;

    for (const logDoc of logsSnapshot.docs) {
        const logData = logDoc.data();

        // 削除済みはスキップ
        if (logData.deleted) continue;

        const petId = logData.petId;
        if (!petId) continue;

        const newEntry = {
            type: 'diary',
            title: logData.taskName || null,
            body: logData.note || null,
            tags: mapTaskNameToTags(logData.taskName || ''),
            imageUrls: [],
            date: logData.timestamp || Timestamp.now(),
            createdBy: logData.createdBy || '',
            createdAt: logData.createdAt || Timestamp.now(),
            updatedAt: logData.updatedAt || Timestamp.now(),
            migratedFrom: 'aina-life-dev',
            migratedFromLogId: logDoc.id,
        };

        const cleanEntry = Object.fromEntries(
            Object.entries(newEntry).filter(([_, v]) => v !== null && v !== undefined)
        );

        await targetDb.collection('pets').doc(petId).collection('entries').doc(logDoc.id).set(cleanEntry);
        count++;
    }

    console.log(`✅ ログ: ${count}件 → エントリーとして移行完了`);
}

async function migrateWeights() {
    console.log('⚖️ 体重データの移行を開始...');

    const weightsSnapshot = await sourceDb.collectionGroup('weights').get();
    let count = 0;

    for (const weightDoc of weightsSnapshot.docs) {
        const weightData = weightDoc.data();
        const petId = weightData.petId;
        if (!petId) continue;

        const newWeight = {
            value: weightData.value,
            unit: weightData.unit === 'g' ? 'g' : 'kg',
            date: weightData.date || Timestamp.now(),
            createdBy: weightData.createdBy || '',
            createdAt: weightData.createdAt || Timestamp.now(),
            updatedAt: weightData.updatedAt || Timestamp.now(),
            migratedFrom: 'aina-life-dev',
        };

        await targetDb.collection('pets').doc(petId).collection('weights').doc(weightDoc.id).set(newWeight);
        count++;
    }

    console.log(`✅ 体重: ${count}件 移行完了`);
}

async function main() {
    console.log('='.repeat(50));
    console.log('🚀 データ移行スクリプト開始');
    console.log('='.repeat(50));
    console.log('ソース: aina-life-dev');
    console.log('ターゲット: aina-life');
    console.log('='.repeat(50));

    try {
        await migrateUsers();
        await migratePets();
        await migrateLogs();
        await migrateWeights();

        console.log('='.repeat(50));
        console.log('🎉 すべてのデータ移行が完了しました！');
        console.log('='.repeat(50));
    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
        process.exit(1);
    }

    process.exit(0);
}

main();
