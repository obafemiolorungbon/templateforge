import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceDataPath = path.resolve(root, '.nx', 'workspace-data');

if (!workspaceDataPath.startsWith(root + path.sep)) {
  throw new Error(`Refusing to remove path outside workspace: ${workspaceDataPath}`);
}

await rm(workspaceDataPath, { recursive: true, force: true });

console.log(`Prepared dev workspace: removed ${path.relative(root, workspaceDataPath)}`);
