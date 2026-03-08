import fs from "node:fs/promises";
import path from "node:path";

const __dirname = "./";
const restore = async () => {
  try {
    const snapshotPath = path.join(__dirname, "snapshot.json");

    await fs.access(snapshotPath);

    const data = await fs.readFile(snapshotPath, "utf-8");
    const { entries } = JSON.parse(data);

    const restoredPath = path.join(__dirname, "workspace_restored");

    try {
      await fs.access(restoredPath);
      throw new Error("FS operation failed");
    } catch {}

    await fs.mkdir(restoredPath);

    for (const entry of entries) {
      const targetPath = path.join(restoredPath, entry.path);

      if (entry.type === "directory") {
        await fs.mkdir(targetPath, { recursive: true });
      }

      if (entry.type === "file") {
        const buffer = Buffer.from(entry.content, "base64");

        await fs.mkdir(path.dirname(targetPath), { recursive: true });

        await fs.writeFile(targetPath, buffer);
      }
    }
  } catch {
    throw new Error("FS operation failed");
  }
};

await restore();
