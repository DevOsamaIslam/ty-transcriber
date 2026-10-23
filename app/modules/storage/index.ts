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
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function saveTranscript(data: {
  id: string;
  title: string;
  transcript: string;
  sourceUrl: string;
}): Promise<void> {
  const TranscriptModel = await getTranscriptModel();
  await TranscriptModel.findOneAndUpdate(
    { videoId: data.id },
    {
      $set: {
        title: data.title,
        transcript: data.transcript,
        sourceUrl: data.sourceUrl,
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

export async function listTranscripts(): Promise<Transcript[]> {
  const TranscriptModel = await getTranscriptModel();
  const docs = await TranscriptModel.find().sort({ createdAt: -1 }).exec();
  return docs.map(toTranscript);
}

export async function deleteTranscript(id: string): Promise<void> {
  const TranscriptModel = await getTranscriptModel();
  await TranscriptModel.deleteOne({ videoId: id }).exec();
}