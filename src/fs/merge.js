import fs from "node:fs/promises";
import path from "node:path";

const __dirname = "./";

const merge = async () => {
  try {
    const workspacePath = path.join(__dirname, "workspace");
    const partsPath = path.join(workspacePath, "parts");

    await fs.access(partsPath);

    const args = process.argv;

    const filesIndex = args.indexOf("--files");
    let files;

    if (filesIndex !== -1) {
      files = args[filesIndex + 1].split(",");
    } else {
      const allFiles = await fs.readdir(partsPath);

      files = allFiles.filter((file) => path.extname(file) === ".txt").sort();

      if (files.length === 0) {
        throw new Error();
      }
    }

    let result = "";

    for (const file of files) {
      const filePath = path.join(partsPath, file);

      await fs.access(filePath);

      const content = await fs.readFile(filePath, "utf-8");

      result += content;
    }

    const outputPath = path.join(workspacePath, "merged.txt");

    await fs.writeFile(outputPath, result);
  } catch {
    throw new Error("FS operation failed");
  }
};

await merge();
