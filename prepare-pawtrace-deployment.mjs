/**
 * PAWTRACE: Railway single-domain deployment preparation.
 * Run from the Git repository root, after merging the reunion PR:
 *   node prepare-pawtrace-deployment.mjs
 *
 * This script checks expected file patterns before writing.
 * It only changes deployment configuration and API base URLs.
 * Review changes with `git diff` before committing.
 */
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';

const root = cwd();
const staged = new Map();

async function load(relative) {
  const filepath = path.join(root, relative);
  try {
    return await readFile(filepath, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read ${relative}. Run this from the PAWTRACE project root. (${error.message})`);
  }
}
function changeOnce(source, before, after, label) {
  const chunks = source.split(before);
  if (chunks.length !== 2) {
    throw new Error(`Cannot safely update ${label}: expected exactly one matching section; found ${chunks.length - 1}. No files have been changed.`);
  }
  return chunks.join(after);
}
function stage(relative, text) { staged.set(relative, text); }
async function ensureNew(relative, text) {
  try {
    await access(path.join(root, relative));
    throw new Error(`${relative} already exists. No files changed: review it manually to avoid overwriting your work.`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  stage(relative, text);
}

// Confirm the final migration is present before preparation.
await load('server/migrations/001_create_users.sql');
await load('server/migrations/002_add_report_owner.sql');
await load('server/migrations/003_create_pet_sightings.sql');
await load('server/migrations/004_add_reunited_at.sql');

const baseBefore = "const API_BASE_URL = 'http://localhost:5000'";
const baseAfter = "const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin";
for (const relative of [
  'client/src/App.tsx',
  'client/src/MyReports.tsx',
  'client/src/PetDetails.tsx',
  'client/src/ReportSightingModal.tsx',
  'client/src/SightingsInbox.tsx',
]) {
  stage(relative, changeOnce(await load(relative), baseBefore, baseAfter, relative));
}

let upload = await load('server/upload.js');
upload = changeOnce(upload, "import path from 'node:path';", "import path from 'node:path';\nimport { mkdirSync } from 'node:fs';", 'upload.js imports');
upload = changeOnce(upload,
  "const uploadDirectory = path.join(currentDirectory, 'uploads');",
  "export const uploadDirectory = process.env.UPLOAD_DIR || path.join(currentDirectory, 'uploads');\nmkdirSync(uploadDirectory, { recursive: true });",
  'upload.js storage path');
stage('server/upload.js', upload);

let api = await load('server/index.js');
api = changeOnce(api,
  "import { uploadPetPhoto } from './upload.js';",
  "import { uploadPetPhoto, uploadDirectory } from './upload.js';",
  'index.js upload import');
api = changeOnce(api,
  'const app = express();',
  "const app = express();\nif (process.env.NODE_ENV === 'production') {\n  app.set('trust proxy', 1);\n}",
  'index.js proxy');
api = changeOnce(api,
  "origin: 'http://localhost:5173',",
  "origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',",
  'index.js CORS');
api = changeOnce(api,
  "app.use(\n  '/uploads',\n  express.static(\n    path.join(currentDirectory, 'uploads')\n  )\n);",
  "app.use('/uploads', express.static(uploadDirectory));",
  'index.js static uploads');
api = changeOnce(api,
  "app.get('/', (req, res) => {",
  "app.get('/api/health', (req, res) => {",
  'index.js health');
const spa = `// Serve the built React app from the same origin as the API.\nif (process.env.NODE_ENV === 'production') {\n  const frontendDirectory = path.join(currentDirectory, '..', 'client', 'dist');\n  app.use(express.static(frontendDirectory));\n  // Express 5 wildcard syntax. Unknown API paths remain 404s.\n  app.get('/{*splat}', (req, res, next) => {\n    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {\n      return next();\n    }\n    return res.sendFile(path.join(frontendDirectory, 'index.html'));\n  });\n}\n\n`;
api = changeOnce(api,
  '// ============================================\n// START SERVER\n// ============================================',
  `${spa}// ============================================\n// START SERVER\n// ============================================`,
  'index.js SPA');
stage('server/index.js', api);

await ensureNew('server/migrations/000_create_pet_reports.sql', `-- Baseline schema: must run before numbered 001+ migrations.\nCREATE TABLE IF NOT EXISTS pet_reports (\n    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n    name VARCHAR(100) NOT NULL,\n    animal_type VARCHAR(10) NOT NULL\n        CHECK (animal_type IN ('Dog', 'Cat')),\n    breed VARCHAR(100),\n    color VARCHAR(100),\n    location VARCHAR(255) NOT NULL,\n    status VARCHAR(10) NOT NULL\n        CHECK (status IN ('Lost', 'Found')),\n    description VARCHAR(1000) NOT NULL,\n    image_url TEXT,\n    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n`);

await ensureNew('server/migrate.js', `import { readdir, readFile } from 'node:fs/promises';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nimport pool from './db.js';\n\nconst dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');\ntry {\n  const files = (await readdir(dir))\n    .filter((name) => /^\\d+_.*\\.sql$/.test(name))\n    .sort();\n  for (const name of files) {\n    const sql = await readFile(path.join(dir, name), 'utf8');\n    await pool.query(sql);\n    console.log('Applied or verified migration:', name);\n  }\n} catch (error) {\n  console.error('Database migration failed:', error);\n  process.exitCode = 1;\n} finally {\n  await pool.end();\n}\n`);

await ensureNew('Dockerfile', `FROM node:22-bookworm-slim AS frontend\nWORKDIR /app/client\nCOPY client/package*.json ./\nRUN npm ci\nCOPY client/ ./\nRUN npm run build\n\nFROM node:22-bookworm-slim\nENV NODE_ENV=production\nWORKDIR /app/server\nCOPY server/package*.json ./\nRUN npm ci --omit=dev\nCOPY server/ ./\nCOPY --from=frontend /app/client/dist /app/client/dist\nEXPOSE 5000\nCMD ["sh", "-c", "node /app/server/migrate.js && exec node /app/server/index.js"]\n`);
await ensureNew('.dockerignore', `**/node_modules\n**/dist\n**/.env\n**/.env.*\n.git\n.gitignore\nserver/uploads\n*.log\n`);

for (const [relative, content] of staged) {
  await writeFile(path.join(root, relative), content, 'utf8');
  console.log('Prepared:', relative);
}
console.log('\nDeployment preparation complete. Run client lint/build, node --check, and git diff before committing.');
