// export GOOGLE_APPLICATION_CREDENTIALS="/Users/nakajimadaichi/.config/gcloud/00_migration-runner_aina-life.json" && . ~/.nvm/nvm.sh && nvm use 20 && node script/migrate_logs_add_deleted_field.js aina-life-stg

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// --- 設定 ---
const PETS_COLLECTION = 'pets';
const LOGS_SUBCOLLECTION = 'logs';
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
console.log(`  - Add 'deleted: false' to all documents in '${LOGS_SUBCOLLECTION}' subcollections where the field is missing.\n`);

initializeApp({
  credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  projectId: projectId,
});

const db = getFirestore();

async function migrateLogs() {
  console.log(`Starting log migration...`);

  const petsSnapshot = await db.collection(PETS_COLLECTION).get();
  if (petsSnapshot.empty) {
    console.log(`'${PETS_COLLECTION}' collection is empty. Nothing to migrate.`);
    return;
  }

  console.log(`Found ${petsSnapshot.size} pets. Checking their logs...`);

  let totalUpdatedLogs = 0;
  let batch = db.batch();
  let writeCount = 0;

  for (const petDoc of petsSnapshot.docs) {
    console.log(`\nProcessing pet: ${petDoc.id}`);
    const logsCollectionRef = petDoc.ref.collection(LOGS_SUBCOLLECTION);
    const logsSnapshot = await logsCollectionRef.get();

    if (logsSnapshot.empty) {
      console.log(`  -> No logs found for this pet.`);
      continue;
    }

    let updatedInThisPet = 0;
    for (const logDoc of logsSnapshot.docs) {
      const logData = logDoc.data();
      if (logData.deleted === undefined) {
        batch.update(logDoc.ref, { deleted: false });
        writeCount++;
        updatedInThisPet++;

        if (writeCount >= MAX_BATCH_SIZE) {
          console.log(`  Committing a batch of ${writeCount} updates...`);
          await batch.commit();
          batch = db.batch();
          writeCount = 0;
          console.log('  Batch committed. Continuing...');
        }
      }
    }
    if (updatedInThisPet > 0) {
      console.log(`  -> Marked ${updatedInThisPet} logs for update.`);
      totalUpdatedLogs += updatedInThisPet;
    } else {
        console.log(`  -> All logs for this pet already have the 'deleted' field.`);
    }
  }

  if (writeCount > 0) {
    console.log(`\nCommitting final batch of ${writeCount} updates...`);
    await batch.commit();
  }

  if (totalUpdatedLogs > 0) {
    console.log('\x1b[32m%s\x1b[0m', `\nLog migration completed successfully!`);
    console.log('\x1b[32m%s\x1b[0m', `Total logs updated: ${totalUpdatedLogs}`);
  } else {
    console.log('\x1b[32m%s\x1b[0m', `\nNo logs needed to be updated.`);
  }
}

// --- 実行 ---
migrateLogs().catch(err => {
  console.error('\x1b[31m%s\x1b[0m', '\nAn error occurred during migration:');
  console.error(err);
  process.exit(1);
});
