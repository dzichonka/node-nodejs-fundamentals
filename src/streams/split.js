import fs from "node:fs/promises";
import fsSync from "node:fs";

import process from "node:process";
import path from "node:path";

const __dirname = "./";
const filePath = path.join(__dirname, "workspace", "source.txt");

const getLines = () => {
  const lines = process.argv.indexOf("--lines");
  return lines !== -1 ? Number(process.argv[lines + 1]) : 10;
};

const split = async () => {
  const linesCount = getLines();

  const reader = fsSync.createReadStream(filePath, { encoding: "utf-8" });

  let rest = "";
  let buffer = [];
  let chunkIndex = 1;

  for await (const chunk of reader) {
    const data = rest + chunk;
    const lines = data.split("\n");

    rest = lines.pop();

    for (let i = 0; i < lines.length; i += 1) {
      buffer.push(lines[i]);
      if (buffer.length === linesCount) {
        const fileName = `chank_${chunkIndex++}.txt`;
        const filePath = path.join(__dirname, "workspace", "chanks", fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, buffer.join("\n") + "\n");
        buffer = [];
      }
    }
  }
  if (rest) buffer.push(rest);
  if (buffer.length) {
    const fileName = `chank_${chunkIndex++}.txt`;
    const filePath = path.join(__dirname, "workspace", "chanks", fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer.join("\n") + "\n");
  }
};

await split();
