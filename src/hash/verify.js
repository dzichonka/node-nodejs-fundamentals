import fs from "fs/promises";
import fsSync from "fs";
import { createHash } from "node:crypto";
import path from "node:path";

const __dirname = "./";

async function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fsSync.createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

const verify = async () => {
  const checksumsPath = path.join(__dirname, "checksums.json");
  const filesPath = path.join(__dirname, "workspace");
  let data;
  try {
    data = await fs.readFile(checksumsPath, "utf-8");
  } catch {
    throw new Error("FS operation failed");
  }

  const checksums = JSON.parse(data);

  for (const [filename, expectedHash] of Object.entries(checksums)) {
    try {
      const actualHash = await hashFile(path.join(filesPath, filename));
      console.log(
        `${filename} — ${actualHash === expectedHash ? "OK" : "FAIL"}`,
      );
    } catch {
      console.log(`${filename} — FAIL`);
    }
  }
};

await verify();
