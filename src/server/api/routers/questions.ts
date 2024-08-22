/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { ocrResponse } from "~/constants";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { VectorDB } from "imvectordb";
import { parse } from "path";

interface Bbox {
  top: number;
  left: number;
  page: number;
  width: number;
  height: number;
}

interface Block {
  bbox: Bbox;
  type: string;
  content: string;
}

interface Chunk {
  embed: string;
  blocks: Block[];
  content: string;
  enriched: string | null;
  enrichment_success: boolean;
}

interface OcrResult {
  type: string;
  chunks: Chunk[];
}

interface OcrResponse {
  usage: {
    num_pages: number;
  };
  result: OcrResult;
}

interface DBDocument {
  id: string;
  embedding: number[];
  metadata: {
    text: string;
  }
};

interface SimilarityResult {
  similarity: number;
  document: DBDocument;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const AnswerAndChunk = z.object({
  answer: z.string(),
  chunkId: z.number(),
})

export const questionsRouter = createTRPCRouter({
  askQuestion: publicProcedure
    .input(z.object({ question: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const answer = await answerQuestion(input.question, ocrResponse);
      return answer;
    }),
});

const answerQuestion = async (question: string, ocrResponse: OcrResponse): Promise<any> => {
  const db = await embedOcrChunks(ocrResponse);

  const candidateChunks = await findBestChunks(db, ocrResponse, question);
  const chunkPromptContent = formatCandidateChunks(candidateChunks);

  const prompt = `Read the following chunks:\n\n${chunkPromptContent}\n\n---\n\n` +
    `Based on the above, ${question}\n` +
    `Return two parts in your response:\n` +
    ` answer: The answer to the question (just the answer, not a complete sentence, but do parse people's names.)\n` +
    ` chunkId: The ID of the chunk you found the answer in.\n`;

  const chatCompletion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [{ role: 'user', "content": prompt }],
    response_format: zodResponseFormat(AnswerAndChunk, "answer_and_chunk"),
  });
  const parsedResponse = chatCompletion.choices[0]?.message.parsed;

  const chunkUsed = db.get(parsedResponse.chunkId.toString());

  return {
    answer: parsedResponse?.answer,
    chunk: chunkUsed.metadata.text,
  }
}

const findBestChunks = async (db: any, ocrResponse: OcrResponse, question: string, numResults = 3): Promise<SimilarityResult[] | undefined> => {
  // Do we want to transform the question? OpenAI's RAG guide suggests just doing it without that step,
  // and the simple way seems to work fine here
  const bestChunks: SimilarityResult[] = await db.queryText(question, numResults);
  return bestChunks;
}

const formatCandidateChunks = (chunks: SimilarityResult[]): string => {
  return chunks
    .map(chunk => `Chunk ID:\n${chunk.document.id}\n\nText:\n${chunk.document.metadata.text}`)
    .join('\n\n\n\n')
}

const embedOcrChunks = async (ocrResponse: OcrResponse): Promise<any> => {
  const db = new VectorDB();
  const chunks = ocrResponse.result.chunks;
  const chunkEmbeds = chunks.map(chunk => chunk.embed);
  await Promise.all(chunkEmbeds.map(embed => db.addText(embed)));
  return db;
}

// function retrieveRelevantChunks(question) {
//   // Transform question into a good embedding
//   // Pick the most similar chunk embeddings - eg `db.query(queryVector, 5)`
// }

const createEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await openai.embeddings.create({
      input: text,
      model: 'text-embedding-ada-002',
    })

    return response.data[0].embedding;
  } catch (error) {
    throw error;
  }
}
