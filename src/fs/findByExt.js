import fs from "node:fs/promises";
import path from "node:path";

const __dirname = "./";

const findByExt = async () => {
  try {
    const workspacePath = path.join(__dirname, "workspace");

    await fs.access(workspacePath);

    const args = process.argv;

    const extIndex = args.indexOf("--ext");

    const ext = extIndex !== -1 ? `.${args[extIndex + 1]}` : ".txt";

    const results = [];

    const scan = async (dir) => {
      const items = await fs.readdir(dir, {
        withFileTypes: true,
      });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          await scan(fullPath);
        }

        if (item.isFile()) {
          if (path.extname(item.name) === ext) {
            const relativePath = path.relative(workspacePath, fullPath);

            results.push(relativePath);
          }
        }
      }
    };

    await scan(workspacePath);

    results.sort();

    for (const file of results) {
      console.log(file);
    }
  } catch {
    throw new Error("FS operation failed");
  }
};

await findByExt();
