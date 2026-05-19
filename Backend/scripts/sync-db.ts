import { existsSync, mkdirSync, copyFileSync } from "fs";
import { dirname, resolve } from "path";

const repoRoot = resolve(import.meta.dir, "..");
const djangoDb = resolve(repoRoot, "../Backend/db.sqlite3");
const honoDb = resolve(repoRoot, "db.sqlite3");

const sourceFiles = [
  djangoDb,
  `${djangoDb}-wal`,
  `${djangoDb}-shm`,
];

const targetFiles = [
  honoDb,
  `${honoDb}-wal`,
  `${honoDb}-shm`,
];

function copyIfExists(source: string, target: string) {
  if (!existsSync(source)) return false;
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  return true;
}

if (!existsSync(djangoDb)) {
  console.error(`Source database not found: ${djangoDb}`);
  process.exit(1);
}

let copied = 0;
for (let i = 0; i < sourceFiles.length; i++) {
  if (copyIfExists(sourceFiles[i], targetFiles[i])) {
    copied++;
  }
}

console.log(`Synced ${copied} file(s) to ${honoDb}`);