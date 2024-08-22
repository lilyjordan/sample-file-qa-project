/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { ocrResponse } from "~/constants";
import OpenAI from 'openai';
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { VectorDB } from 'imvectordb';

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

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const questionsRouter = createTRPCRouter({
  askQuestion: publicProcedure
    .input(z.object({ question: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const answer = await answerQuestion(input.question, ocrResponse);
      return answer;
    }),
});

const answerQuestion = async (question: string, ocrResponse: OcrResponse): Promise<string | null | undefined> => {
  // 1. retrieve relevant parts
  // 2. create augmented prompt
  // 3. get and return answer
  const db = await embedOcrChunks(ocrResponse);
  const results: SimilarityResult[] = await db.queryText(question); // TODO transform question
  const result = results[0]?.document.metadata.text;
  return result;
  // const input = parseOcrResponse(ocrResponse);
  // const prompt = `Read the following document:\n\n${input}\n\n---\n\n` +
  //   `Based on the above, ${question}\n` +
  //   `Return just the answer, not a complete sentence, but do parse people's names.\n` +
  //   `Your answer should be in the following format:\nAnswer: {answer}\nReason: "{reason}"\n` +
  //   `Fill in {reason} with a direct quote from the document that supports your answer. Do not add anything else except the direct quote.`;
  // const chatCompletion = await client.chat.completions.create({
  //   messages: [{ role: 'user', "content": prompt }],
  //   model: 'gpt-3.5-turbo',
  // });
  // const messageContent = chatCompletion.choices[0]?.message.content;
  // return messageContent;
}

const parseOcrResponse = (ocrResponse: OcrResponse): string => {
  return ocrResponse.result.chunks
    .map(chunk => chunk.blocks.map(block => block.content).join('\n'))
    .join('\n');
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