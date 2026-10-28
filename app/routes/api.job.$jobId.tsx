import type { LoaderFunctionArgs } from "react-router";
import { getJob } from "../modules/job";

export async function loader({ params }: LoaderFunctionArgs) {
  const { jobId } = params as { jobId: string };
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send the current state immediately.
      const initial = getJob(jobId);
      if (!initial) {
        send({ step: "error", message: "Job not found" });
        controller.close();
        return;
      }
      send(initial);

      // Poll the job store and push updates to the client.
      const interval = setInterval(() => {
        const current = getJob(jobId);
        if (!current) {
          send({ step: "error", message: "Job lost" });
          clearInterval(interval);
          controller.close();
          return;
        }
        send(current);
        if (current.step === "done" || current.step === "error") {
          clearInterval(interval);
          controller.close();
        }
      }, 150);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
