import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDb, disconnectDb } from "../db";
import {
  saveTranscript,
  getTranscript,
  listTranscripts,
  deleteTranscript,
} from "./index";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDb(mongo.getUri());
});

afterAll(async () => {
  await disconnectDb();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

describe("storage module (mongo)", () => {
  describe("saveTranscript + getTranscript", () => {
    it("saves and retrieves a transcript", async () => {
      await saveTranscript({
        id: "abc123",
        title: "Test Video",
        transcript: "This is the transcript text",
        sourceUrl: "https://youtube.com/watch?v=abc123",
      });

      const result = await getTranscript("abc123");
      expect(result).toMatchObject({
        id: "abc123",
        title: "Test Video",
        transcript: "This is the transcript text",
        sourceUrl: "https://youtube.com/watch?v=abc123",
      });
      expect(result?.createdAt).toBeDefined();
    });

    it("returns null for a non-existent transcript", async () => {
      const result = await getTranscript("nonexistent");
      expect(result).toBeNull();
    });

    it("saves and retrieves the language", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "url-a",
        language: "es",
      });

      const result = await getTranscript("a");
      expect(result?.language).toBe("es");
    });

    it("saves and retrieves the extended metadata fields", async () => {
      await saveTranscript({
        id: "ext1",
        title: "Title",
        originalTitle: "Original Title",
        transcript: "content",
        sourceUrl: "https://youtube.com/watch?v=ext1",
        channel: "Channel Name",
        channelId: "UCabc123",
        playlistId: "PLabc123",
        playlistIndex: 3,
        source: "whisper",
        language: "en",
        uploadDate: "2024-01-15",
        videoDate: "2024-01-15",
      });

      const result = await getTranscript("ext1");
      expect(result).toMatchObject({
        id: "ext1",
        title: "Title",
        originalTitle: "Original Title",
        transcript: "content",
        sourceUrl: "https://youtube.com/watch?v=ext1",
        channel: "Channel Name",
        channelId: "UCabc123",
        playlistId: "PLabc123",
        playlistIndex: 3,
        source: "whisper",
        language: "en",
        uploadDate: "2024-01-15",
        videoDate: "2024-01-15",
      });
      expect(result?.createdAt).toBeDefined();
    });
  });

  describe("listTranscripts", () => {
    it("returns an empty array when no transcripts exist", async () => {
      const result = await listTranscripts();
      expect(result).toEqual([]);
    });

    it("returns all saved transcripts sorted by createdAt descending", async () => {
      await saveTranscript({
        id: "a",
        title: "First",
        transcript: "content a",
        sourceUrl: "url-a",
      });
      await new Promise((r) => setTimeout(r, 10));
      await saveTranscript({
        id: "b",
        title: "Second",
        transcript: "content b",
        sourceUrl: "url-b",
      });

      const result = await listTranscripts();
      expect(result.length).toBe(2);
      expect(result[0].id).toBe("b");
      expect(result[1].id).toBe("a");
    });
  });

  describe("deleteTranscript", () => {
    it("deletes a transcript and it no longer appears in list", async () => {
      await saveTranscript({
        id: "to-delete",
        title: "To Delete",
        transcript: "content",
        sourceUrl: "url",
      });

      await deleteTranscript("to-delete");

      const result = await getTranscript("to-delete");
      expect(result).toBeNull();

      const list = await listTranscripts();
      expect(list.length).toBe(0);
    });
  });

  describe("channel / playlist organization", () => {
    it("saves and returns channel, playlistId and source", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "url-a",
        channel: "My Channel",
        playlistId: "PLabc123",
        source: "captions",
      });

      const result = await getTranscript("a");
      expect(result).toMatchObject({
        id: "a",
        channel: "My Channel",
        playlistId: "PLabc123",
        source: "captions",
      });
    });

    it("listTranscripts filters by playlistId", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "url-a",
        channel: "My Channel",
        playlistId: "PLabc123",
        source: "captions",
      });
      await saveTranscript({
        id: "b",
        title: "B",
        transcript: "content b",
        sourceUrl: "url-b",
        channel: "My Channel",
        playlistId: "PLother",
        source: "whisper",
      });
      await saveTranscript({
        id: "c",
        title: "C",
        transcript: "content c",
        sourceUrl: "url-c",
        channel: "My Channel",
      });

      const result = await listTranscripts({ playlistId: "PLabc123" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("a");
    });

    it("listTranscripts filters by channel", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "url-a",
        channel: "Channel One",
      });
      await saveTranscript({
        id: "b",
        title: "B",
        transcript: "content b",
        sourceUrl: "url-b",
        channel: "Channel Two",
      });

      const result = await listTranscripts({ channel: "Channel One" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("a");
    });

    it("listTranscripts without a filter returns everything", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "url-a",
        channel: "Channel One",
        playlistId: "PLabc123",
      });

      const result = await listTranscripts();
      expect(result).toHaveLength(1);
    });

    it("listTranscripts filters by query (case-insensitive title match)", async () => {
      await saveTranscript({
        id: "a",
        title: "Arabic Lesson 1",
        transcript: "content a",
        sourceUrl: "url-a",
      });
      await saveTranscript({
        id: "b",
        title: "English Lesson",
        transcript: "content b",
        sourceUrl: "url-b",
      });

      const result = await listTranscripts({ query: "ARABIC" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("a");
    });

    it("listTranscripts filters by query against channel", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "url-a",
        channel: "Channel One",
      });
      await saveTranscript({
        id: "b",
        title: "B",
        transcript: "content b",
        sourceUrl: "url-b",
        channel: "Channel Two",
      });

      const result = await listTranscripts({ query: "Channel" });
      expect(result).toHaveLength(2);

      const resultTwo = await listTranscripts({ query: "Two" });
      expect(resultTwo).toHaveLength(1);
      expect(resultTwo[0].id).toBe("b");
    });

    it("listTranscripts filters by query against original title and source url", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "https://youtube.com/watch?v=abc123",
        originalTitle: "الأصل العربي",
      });
      await saveTranscript({
        id: "b",
        title: "B",
        transcript: "content b",
        sourceUrl: "https://youtube.com/watch?v=def456",
      });

      const byOriginal = await listTranscripts({ query: "العربي" });
      expect(byOriginal).toHaveLength(1);
      expect(byOriginal[0].id).toBe("a");

      const byUrl = await listTranscripts({ query: "def456" });
      expect(byUrl).toHaveLength(1);
      expect(byUrl[0].id).toBe("b");
    });

    it("listTranscripts filters by source", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "url-a",
        source: "captions",
      });
      await saveTranscript({
        id: "b",
        title: "B",
        transcript: "content b",
        sourceUrl: "url-b",
        source: "whisper",
      });

      const result = await listTranscripts({ source: "whisper" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("b");
    });

    it("listTranscripts filters by language", async () => {
      await saveTranscript({
        id: "a",
        title: "A",
        transcript: "content a",
        sourceUrl: "url-a",
        language: "en",
      });
      await saveTranscript({
        id: "b",
        title: "B",
        transcript: "content b",
        sourceUrl: "url-b",
        language: "ar",
      });

      const result = await listTranscripts({ language: "ar" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("b");
    });

    it("listTranscripts combines query and source filters", async () => {
      await saveTranscript({
        id: "a",
        title: "Arabic Lesson",
        transcript: "content a",
        sourceUrl: "url-a",
        source: "captions",
      });
      await saveTranscript({
        id: "b",
        title: "Arabic Lesson 2",
        transcript: "content b",
        sourceUrl: "url-b",
        source: "whisper",
      });
      await saveTranscript({
        id: "c",
        title: "English Lesson",
        transcript: "content c",
        sourceUrl: "url-c",
        source: "whisper",
      });

      const result = await listTranscripts({ query: "arabic", source: "whisper" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("b");
    });
  });
});