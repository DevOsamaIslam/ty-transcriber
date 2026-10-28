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
  /** Original title as published on YouTube (may differ from `title`). */
  originalTitle?: string;
  transcript: string;
  sourceUrl: string;
  channel?: string;
  /** YouTube channel id. */
  channelId?: string;
  playlistId?: string;
  /** 1-based position of the video within its playlist, if any. */
  playlistIndex?: number;
  /** Where the transcript came from: YouTube captions or Whisper. */
  source?: "captions" | "whisper";
  /** Language used for the transcript (ISO 639-1). Undefined = video's default language. */
  language?: string;
  /** Video upload date, ISO 8601 (e.g. "2024-01-15"). */
  uploadDate?: string;
  /** Video date, ISO 8601 (e.g. "2024-01-15"). */
  videoDate?: string;
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

  /** YouTube channel id. */
  @prop({ type: () => String })
  public channelId?: string;

  @prop({ type: () => String })
  public playlistId?: string;

  /** 1-based position of the video within its playlist, if any. */
  @prop({ type: () => Number })
  public playlistIndex?: number;

  @prop({ type: () => String })
  public source?: "captions" | "whisper";

  @prop({ type: () => String })
  public language?: string;

  /** Video upload date, ISO 8601. */
  @prop({ type: () => String })
  public uploadDate?: string;

  /** Video date, ISO 8601. */
  @prop({ type: () => String })
  public videoDate?: string;

  /** Original title as published on YouTube. */
  @prop({ type: () => String })
  public originalTitle?: string;

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
    originalTitle: doc.originalTitle ?? undefined,
    transcript: doc.transcript,
    sourceUrl: doc.sourceUrl,
    channel: doc.channel ?? undefined,
    channelId: doc.channelId ?? undefined,
    playlistId: doc.playlistId ?? undefined,
    playlistIndex: doc.playlistIndex ?? undefined,
    source: doc.source ?? undefined,
    language: doc.language ?? undefined,
    uploadDate: doc.uploadDate ?? undefined,
    videoDate: doc.videoDate ?? undefined,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function saveTranscript(data: {
  id: string;
  title: string;
  originalTitle?: string;
  transcript: string;
  sourceUrl: string;
  channel?: string;
  channelId?: string;
  playlistId?: string;
  playlistIndex?: number;
  source?: "captions" | "whisper";
  language?: string;
  uploadDate?: string;
  videoDate?: string;
}): Promise<void> {
  const started = Date.now();
  console.log(
    `[storage] saveTranscript start videoId=${data.id} title="${data.title}" source=${data.source ?? "-"} language=${data.language ?? "-"} transcriptLen=${data.transcript.length}`
  );
  const TranscriptModel = await getTranscriptModel();
  await TranscriptModel.findOneAndUpdate(
    { videoId: data.id },
    {
      $set: {
        title: data.title,
        transcript: data.transcript,
        sourceUrl: data.sourceUrl,
        ...(data.originalTitle !== undefined && { originalTitle: data.originalTitle }),
        ...(data.channel !== undefined && { channel: data.channel }),
        ...(data.channelId !== undefined && { channelId: data.channelId }),
        ...(data.playlistId !== undefined && { playlistId: data.playlistId }),
        ...(data.playlistIndex !== undefined && { playlistIndex: data.playlistIndex }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.uploadDate !== undefined && { uploadDate: data.uploadDate }),
        ...(data.videoDate !== undefined && { videoDate: data.videoDate }),
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  ).exec();
  console.log(
    `[storage] saveTranscript done videoId=${data.id} in ${Date.now() - started}ms`
  );
}

export async function getTranscript(id: string): Promise<Transcript | null> {
  const TranscriptModel = await getTranscriptModel();
  const doc = await TranscriptModel.findOne({ videoId: id }).exec();
  return doc ? toTranscript(doc) : null;
}

export interface TranscriptListFilter {
  /** Restrict to a single channel. */
  channel?: string;
  /** Restrict to a single playlist. */
  playlistId?: string;
  /** Free-text match (case-insensitive) against title, channel, original title and source URL. */
  query?: string;
  /** Restrict to a transcript source ("captions" | "whisper"). */
  source?: "captions" | "whisper";
  /** Restrict to a transcript language (ISO 639-1). */
  language?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listTranscripts(filter?: TranscriptListFilter): Promise<Transcript[]> {
  const TranscriptModel = await getTranscriptModel();
  const query: Record<string, unknown> = {};
  if (filter?.channel) query.channel = filter.channel;
  if (filter?.playlistId) query.playlistId = filter.playlistId;
  if (filter?.source) query.source = filter.source;
  if (filter?.language) query.language = filter.language;
  if (filter?.query) {
    const regex = new RegExp(escapeRegExp(filter.query), "i");
    query.$or = [
      { title: regex },
      { channel: regex },
      { originalTitle: regex },
      { sourceUrl: regex },
    ];
  }
  const docs = await TranscriptModel.find(query).sort({ createdAt: -1 }).exec();
  return docs.map(toTranscript);
}

export async function deleteTranscript(id: string): Promise<void> {
  const TranscriptModel = await getTranscriptModel();
  await TranscriptModel.deleteOne({ videoId: id }).exec();
}