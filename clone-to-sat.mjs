// clone-to-sat.mjs — one-off: copy the Firestore (default) DB into the named
// "sat" DB within the SAME project (dicky-portfolio-83529). Recursively copies
// every collection, document, and nested subcollection, preserving doc IDs.
//
// Usage:
//   1. Save a fresh service-account key as ./clone-key.json (see chat steps)
//   2. node clone-to-sat.mjs
//   3. Revoke the key in Google Cloud + delete ./clone-key.json afterwards
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DEST_DB = process.argv[2] || "env_sat"; // pass the exact DB id as arg 1

const key = JSON.parse(readFileSync("./clone-key.json", "utf8"));
const app = initializeApp({ credential: cert(key) });

const src = getFirestore(app); // (default)
const dest = getFirestore(app, DEST_DB); // named SAT DB

async function copyCollection(srcColl, destColl) {
  const snap = await srcColl.get();
  let count = 0;
  for (const docSnap of snap.docs) {
    const destDoc = destColl.doc(docSnap.id);
    await destDoc.set(docSnap.data());
    count++;
    // Recurse into any subcollections (e.g. settings/site/resumeChunks).
    const subColls = await docSnap.ref.listCollections();
    for (const sub of subColls) {
      await copyCollection(sub, destDoc.collection(sub.id));
    }
  }
  console.log(`  ${srcColl.path} -> ${count} docs`);
  return count;
}

async function main() {
  const collections = await src.listCollections();
  console.log(
    `Cloning ${collections.length} top-level collection(s): (default) -> "${DEST_DB}"`
  );
  let total = 0;
  for (const coll of collections) {
    total += await copyCollection(coll, dest.collection(coll.id));
  }
  console.log(`Done. Copied ${total} document(s) into the "${DEST_DB}" database.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
