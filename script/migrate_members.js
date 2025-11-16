// export GOOGLE_APPLICATION_CREDENTIALS="/Users/nakajimadaichi/.config/gcloud/00_migration-runner_aina-life.json" && . ~/.nvm/nvm.sh && nvm use 20 && node script/migrate_members.js aina-life-stg

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// スクリプト実行時にコマンドライン引数からプロジェクトIDを取得
const projectId = process.argv[2];
if (!projectId) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Firebase Project ID is required as an argument.');
  console.log('Usage: node script/migrate_members.js <your-firebase-project-id>');
  process.exit(1);
}

// サービスアカウントキーのパスが環境変数に設定されているか確認
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  console.log('Please set it to the path of your service account key file.');
  process.exit(1);
}

console.log(`\n\x1b[32m%s\x1b[0m`, `Connecting to project: ${projectId}`);

// Firebase Admin SDKを初期化
initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: projectId,
});

const db = getFirestore();

async function migrate() {
  console.log('Starting migration...');

  const membersSnapshot = await db.collectionGroup('members').get();
  console.log(`Found ${membersSnapshot.size} total member documents to check.`);

  let batch = db.batch();
  let writeCount = 0;
  const MAX_BATCH_SIZE = 498; // Firestoreのバッチ書き込み上限は500

  // --- フェーズ1: 保留中の招待を修正 (petNameを追加) ---
  console.log('\n--- Phase 1: Fixing pending invitations ---');
  const pendingToFix = membersSnapshot.docs.filter(doc => doc.data().status === 'pending' && !doc.data().petName);
  console.log(`Found ${pendingToFix.length} pending invitations missing 'petName'.`);

  for (const memberDoc of pendingToFix) {
    const petRef = memberDoc.ref.parent.parent;
    if (!petRef) continue;

    const petDoc = await petRef.get();
    if (petDoc.exists) {
      const petData = petDoc.data();
      console.log(`  Updating pending invite ${memberDoc.id} with petName: ${petData.name}`);
      batch.update(memberDoc.ref, {
        petName: petData.name,
        petProfileImageUrl: petData.profileImageUrl || null,
      });
      writeCount++;
    }
  }

  // --- フェーズ2: 古いアクティブメンバーを新しい形式に移行 ---
  console.log('\n--- Phase 2: Migrating old active members to new format ---');
  const activeToMigrate = membersSnapshot.docs.filter(doc => doc.data().status === 'active' && doc.id !== doc.data().uid);
  console.log(`Found ${activeToMigrate.length} active members to migrate.`);

  for (const oldMemberDoc of activeToMigrate) {
    const oldData = oldMemberDoc.data();
    const petRef = oldMemberDoc.ref.parent.parent;
    if (!petRef || !oldData.uid) {
        console.log(`  Skipping migration for ${oldMemberDoc.id} due to missing uid or parent ref.`);
        continue;
    }

    console.log(`  Migrating active member ${oldMemberDoc.id} (UID: ${oldData.uid})`);

    const newMemberRef = petRef.collection('members').doc(oldData.uid);

    // 新しいドキュメントに古いデータを引き継いで作成
    batch.set(newMemberRef, {
      uid: oldData.uid,
      role: oldData.role || 'viewer',
      status: 'active',
      inviteEmail: oldData.inviteEmail || null,
      invitedBy: oldData.invitedBy || null,
      invitedAt: oldData.invitedAt || null,
      createdAt: oldData.createdAt || FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    writeCount++;

    // 古いドキュメントを削除
    batch.delete(oldMemberDoc.ref);
    writeCount++;

    if (writeCount >= MAX_BATCH_SIZE) {
        console.log(`Committing a batch of ${writeCount} writes...`);
        await batch.commit();
        batch = db.batch();
        writeCount = 0;
    }
  }

  if (writeCount > 0) {
    console.log(`\nCommitting final batch of ${writeCount} writes...`);
    await batch.commit();
    console.log('\x1b[32m%s\x1b[0m', 'Migration batch committed successfully!');
  } else {
    console.log('\nNo documents needed migration.');
  }

  console.log('\nMigration script finished.');
}

migrate().catch(err => {
    console.error('\x1b[31m%s\x1b[0m', 'An error occurred during migration:');
    console.error(err);
});
