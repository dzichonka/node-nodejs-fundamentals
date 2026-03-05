import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const snapshot = async () => {
  try {
    const workspacePath = path.join(__dirname, "workspace");

    await fs.access(workspacePath);

    const rootPath = path.resolve(workspacePath);
    const entries = [];

    const scan = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(workspacePath, fullPath);

        if (item.isDirectory()) {
          entries.push({
            path: relativePath,
            type: "directory",
          });

          await scan(fullPath);
        }

        if (item.isFile()) {
          const buffer = await fs.readFile(fullPath);
          const stats = await fs.stat(fullPath);

          entries.push({
            path: relativePath,
            type: "file",
            size: stats.size,
            content: buffer.toString("base64"),
          });
        }
      }
    };

    await scan(workspacePath);

    const snapshotData = {
      rootPath,
      entries,
    };

    const snapshotPath = path.join(__dirname, "snapshot.json");

    await fs.writeFile(snapshotPath, JSON.stringify(snapshotData, null, 2));
  } catch {
    throw new Error("FS operation failed");
  }
};

await snapshot();
