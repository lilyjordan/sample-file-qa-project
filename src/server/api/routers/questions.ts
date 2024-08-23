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
  const { db, chunkIndices } = await embedOcrChunks(ocrResponse);

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

  const chunkIdUsed = parsedResponse.chunkId.toString();
  const chunkUsed = ocrResponse.result.chunks[chunkIndices[chunkIdUsed]];
  const blocks = chunkUsed.blocks;
  const bestBlock = await findBestBlock(parsedResponse?.answer, blocks);

  return {
    answer: parsedResponse?.answer,
    block: bestBlock.content,
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
  const chunkIndices: Record<string, number> = {};
  const chunks = ocrResponse.result.chunks;
  for (let i = 0; i < chunks.length; i++) {
    const document = await db.addText(chunks[i].embed);
    chunkIndices[document.id] = i;
  }
  return { db, chunkIndices };
}

const findBestBlock = async (answer: string, blocks: Block[]): Promise<Block> => {
  const blockdb = new VectorDB();
  const blockIndices: Record<string, number> = {};

  for (let i = 0; i < blocks.length; i++) {
    const document = await blockdb.addText(blocks[i].content);
    blockIndices[document.id] = i;
  }

  const bestMatch = await blockdb.queryText(answer, 1);
  const bestMatchBlockIndex = blockIndices[bestMatch[0].document.id];
  return blocks[bestMatchBlockIndex];
}