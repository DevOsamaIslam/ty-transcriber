import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR =
  process.env.TY_TRANSCRIBER_DATA_DIR ||
  path.join(process.cwd(), "server", "data", "transcripts");

export interface Transcript {
  id: string;
  title: string;
  transcript: string;
  sourceUrl: string;
  createdAt: string;
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function filePath(id: string) {
  return path.join(DATA_DIR, `${id}.json`);
}

export async function saveTranscript(data: {
  id: string;
  title: string;
  transcript: string;
  sourceUrl: string;
}): Promise<void> {
  await ensureDir();
  const transcript: Transcript = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(filePath(data.id), JSON.stringify(transcript, null, 2), "utf-8");
}

export async function getTranscript(id: string): Promise<Transcript | null> {
  try {
    await ensureDir();
    const raw = await fs.readFile(filePath(id), "utf-8");
    return JSON.parse(raw) as Transcript;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

export async function listTranscripts(): Promise<Transcript[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const transcripts: Transcript[] = [];
  for (const file of jsonFiles) {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
    transcripts.push(JSON.parse(raw) as Transcript);
  }
  return transcripts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteTranscript(id: string): Promise<void> {
  await fs.unlink(filePath(id)).catch((err: any) => {
    if (err.code !== "ENOENT") throw err;
  });
}