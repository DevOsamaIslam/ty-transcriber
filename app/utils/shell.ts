import { exec } from "node:child_process";
import { unlink } from "node:fs/promises";

// exec buffers the child's entire output — raise the cap so verbose tools
// (e.g. yt-dlp) don't crash with "maxBuffer exceeded", and bound the runtime
// so a hung child fails instead of blocking the request forever.
const MAX_BUFFER_BYTES = 16 * 1024 * 1024;
const TIMEOUT_MS = 10 * 60 * 1000;

export function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: MAX_BUFFER_BYTES, timeout: TIMEOUT_MS }, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function removeFile(filePath: string): Promise<void> {
  await unlink(filePath).catch((err: any) => {
    if (err.code !== "ENOENT") throw err;
  });
}