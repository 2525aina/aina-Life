// export GOOGLE_APPLICATION_CREDENTIALS="/Users/nakajimadaichi/.config/gcloud/00_migration-runner_aina-life.json" && . ~/.nvm/nvm.sh && nvm use 20 && node script/migrate_dogs_to_pets.js aina-life-stg

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// --- 設定 ---
const SOURCE_COLLECTION = 'dogs';
const TARGET_COLLECTION = 'pets';
const SUBCOLLECTIONS = ['members', 'tasks', 'logs', 'chats', 'weights']; // 移行するサブコレクションのリスト
const MAX_BATCH_SIZE = 490; // Firestoreのバッチ書き込み上限は500

// --- 初期化 ---
const projectId = process.argv[2];
if (!projectId) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: Firebase Project ID is required as an argument.');
  console.log(`Usage: node ${process.argv[1]} <your-firebase-project-id>`);
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  console.log('Please set it to the path of your service account key file.');
  process.exit(1);
}

console.log(`\n\x1b[32m%s\x1b[0m`, `Target Project: ${projectId}`);
console.log(`Migration Plan:`);
console.log(`  - From collection: '${SOURCE_COLLECTION}'`);
console.log(`  - To collection:   '${TARGET_COLLECTION}'`);
console.log(`  - Subcollections to migrate: ${SUBCOLLECTIONS.join(', ')}\n`);

initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: projectId,
});

const db = getFirestore();

/**
 * 指定されたコレクションのデータを新しいコレクションにコピーする関数
 * @param {string} srcCollectionName - コピー元コレクション名
 * @param {string} destCollectionName - コピー先コレクション名
 */
async function migrateCollection(srcCollectionName, destCollectionName) {
  console.log(`Starting migration from '${srcCollectionName}' to '${destCollectionName}'...`);

  const srcCollectionRef = db.collection(srcCollectionName);
  const documentsSnapshot = await srcCollectionRef.get();

  if (documentsSnapshot.empty) {
    console.log(`Source collection '${srcCollectionName}' is empty. Nothing to migrate.`);
    return;
  }

  console.log(`Found ${documentsSnapshot.size} documents in '${srcCollectionName}'.`);

  let batch = db.batch();
  let writeCount = 0;

  for (const doc of documentsSnapshot.docs) {
    const docData = doc.data();
    const newDocRef = db.collection(destCollectionName).doc(doc.id);

    console.log(`  Migrating doc: ${doc.id}`);
    batch.set(newDocRef, docData);
    writeCount++;

    // サブコレクションの移行
    for (const subcollection of SUBCOLLECTIONS) {
      const srcSubcollectionRef = srcCollectionRef.doc(doc.id).collection(subcollection);
      const destSubcollectionRef = newDocRef.collection(subcollection);
      const subDocsSnapshot = await srcSubcollectionRef.get();

      if (!subDocsSnapshot.empty) {
        console.log(`    -> Migrating subcollection '${subcollection}' (${subDocsSnapshot.size} docs)`);
        for (const subDoc of subDocsSnapshot.docs) {
          batch.set(destSubcollectionRef.doc(subDoc.id), subDoc.data());
          writeCount++;

          if (writeCount >= MAX_BATCH_SIZE) {
            console.log(`\nCommitting a batch of ${writeCount} writes...`);
            await batch.commit();
            batch = db.batch();
            writeCount = 0;
            console.log('Batch committed. Continuing...');
          }
        }
      }
    }

    if (writeCount >= MAX_BATCH_SIZE) {
        console.log(`\nCommitting a batch of ${writeCount} writes...`);
        await batch.commit();
        batch = db.batch();
        writeCount = 0;
        console.log('Batch committed. Continuing...');
    }
  }

  if (writeCount > 0) {
    console.log(`\nCommitting final batch of ${writeCount} writes...`);
    await batch.commit();
  }

  console.log('\x1b[32m%s\x1b[0m', `\nMigration from '${srcCollectionName}' to '${destCollectionName}' completed successfully!`);
}

// --- 実行 ---
migrateCollection(SOURCE_COLLECTION, TARGET_COLLECTION).catch(err => {
  console.error('\x1b[31m%s\x1b[0m', '\nAn error occurred during migration:');
  console.error(err);
  process.exit(1);
});
