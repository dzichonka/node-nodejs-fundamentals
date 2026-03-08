import process from "node:process";
import { spawn } from "node:child_process";

const execCommand = () => {
  const commandString = process.argv[2];

  if (!commandString) {
    process.exit(1);
  }

  const parts = commandString.split(" ");

  const command = parts[0];

  const args = parts.slice(1);

  const childProcess = spawn(command, args, {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
    shell: false,
    cwd: process.cwd(),
  });

  childProcess.stdout.pipe(process.stdout);

  childProcess.stderr.pipe(process.stderr);

  childProcess.on("exit", (code) => {
    process.exit(code || 0);
  });

  childProcess.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });

  process.on("SIGINT", () => {
    childProcess.kill("SIGINT");
  });
  process.on("SIGTERM", () => {
    childProcess.kill("SIGTERM");
  });
};

execCommand();
