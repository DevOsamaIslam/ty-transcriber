export type JobStep = "metadata" | "captions" | "formatting" | "saving" | "done" | "error";

export interface JobProgress {
  step: JobStep;
  message: string;
  error?: string;
  transcriptId?: string;
}

const jobs = new Map<string, JobProgress>();
const JOB_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function createJob(): string {
  const id = Math.random().toString(36).slice(2, 10);
  jobs.set(id, { step: "metadata", message: "Starting…" });
  setTimeout(() => jobs.delete(id), JOB_TTL_MS);
  return id;
}

export function updateJob(
  jobId: string,
  progress: Partial<JobProgress> & { step: JobStep }
): void {
  const current = jobs.get(jobId);
  if (current) {
    jobs.set(jobId, { ...current, ...progress });
  }
}

export function getJob(jobId: string): JobProgress | undefined {
  return jobs.get(jobId);
}

export function deleteJob(jobId: string): void {
  jobs.delete(jobId);
}
