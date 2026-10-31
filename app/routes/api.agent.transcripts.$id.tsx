import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getTranscript } from "../modules/storage";

/**
 * Agent-facing transcript retrieval endpoint (no account / session required).
 *
 * This is the backend the Agent Commerce Gateway fronts: the gateway exposes
 * it as the paid `transcript_get` resource (0.01 USDC per retrieval via x402),
 * verifies the buyer's payment, then proxies the call here. See
 * `agent-commerce/config.example.yaml`.
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params as { id: string };

  if (!id) {
    return data({ error: "Missing transcript id" }, { status: 400 });
  }

  const transcript = await getTranscript(id);

  if (!transcript) {
    return data({ error: "Transcript not found" }, { status: 404 });
  }

  return { transcript };
}
