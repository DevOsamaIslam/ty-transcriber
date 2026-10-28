import "reflect-metadata";
import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from "@typegoose/typegoose";
import { connectDb } from "../db";

export interface Transcript {
  id: string;
  title: string;
  transcript: string;
  sourceUrl: string;
  channel?: string;
  playlistId?: string;
  /** Where the transcript came from: YouTube captions or Whisper. */
  source?: "captions" | "whisper";
  /** Language used for the transcript (ISO 639-1). Undefined = video's default language. */
  language?: string;
  createdAt: string;
}

/**
 * Mongo document for stored transcripts.
 *
 * Note: Mongoose reserves the `id` virtual on documents, so the lookup id
 * (the YouTube video id) is persisted as `videoId` and mapped back to `id`
 * in the public Transcript DTO. `createdAt`/`updatedAt` are managed by
 * Mongoose timestamps. Explicit `type` annotations are required because the
 * esbuild-based build does not emit decorator metadata.
 */
@modelOptions({ schemaOptions: { timestamps: true } })
class TranscriptDoc {
  @prop({ required: true, unique: true, index: true, type: () => String })
  public videoId!: string;

  @prop({ required: true, type: () => String })
  public title!: string;

  @prop({ required: true, type: () => String })
  public transcript!: string;

  @prop({ required: true, type: () => String })
  public sourceUrl!: string;

  @prop({ type: () => String })
  public channel?: string;

  @prop({ type: () => String })
  public playlistId?: string;

  @prop({ type: () => String })
  public source?: "captions" | "whisper";

  @prop({ type: () => String })
  public language?: string;

  public createdAt!: Date;
  public updatedAt!: Date;
}

let model: ReturnModelType<typeof TranscriptDoc> | null = null;

async function getTranscriptModel(): Promise<ReturnModelType<typeof TranscriptDoc>> {
  await connectDb();
  if (!model) {
    model = getModelForClass(TranscriptDoc);
  }
  return model;
}

function toTranscript(doc: DocumentType<TranscriptDoc>): Transcript {
  return {
    id: doc.videoId,
    title: doc.title,
    transcript: doc.transcript,
    sourceUrl: doc.sourceUrl,
    channel: doc.channel ?? undefined,
    playlistId: doc.playlistId ?? undefined,
    source: doc.source ?? undefined,
    language: doc.language ?? undefined,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function saveTranscript(data: {
  id: string;
  title: string;
  transcript: string;
  sourceUrl: string;
  channel?: string;
  playlistId?: string;
  source?: "captions" | "whisper";
  language?: string;
}): Promise<void> {
  const TranscriptModel = await getTranscriptModel();
  await TranscriptModel.findOneAndUpdate(
    { videoId: data.id },
    {
      $set: {
        title: data.title,
        transcript: data.transcript,
        sourceUrl: data.sourceUrl,
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.playlistId !== undefined && { playlistId: data.playlistId }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.language !== undefined && { language: data.language }),
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  ).exec();
}

export async function getTranscript(id: string): Promise<Transcript | null> {
  const TranscriptModel = await getTranscriptModel();
  const doc = await TranscriptModel.findOne({ videoId: id }).exec();
  return doc ? toTranscript(doc) : null;
}

export async function listTranscripts(filter?: {
  channel?: string;
  playlistId?: string;
}): Promise<Transcript[]> {
  const TranscriptModel = await getTranscriptModel();
  const query: Record<string, string> = {};
  if (filter?.channel) query.channel = filter.channel;
  if (filter?.playlistId) query.playlistId = filter.playlistId;
  const docs = await TranscriptModel.find(query).sort({ createdAt: -1 }).exec();
  return docs.map(toTranscript);
}

export async function deleteTranscript(id: string): Promise<void> {
  const TranscriptModel = await getTranscriptModel();
  await TranscriptModel.deleteOne({ videoId: id }).exec();
}