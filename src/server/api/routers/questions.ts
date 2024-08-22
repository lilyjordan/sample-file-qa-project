/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { ocrResponse } from "~/constants";
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})



import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const questionsRouter = createTRPCRouter({
  askQuestion: publicProcedure
    .input(z.object({ question: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const answer = await answerQuestion(input.question, ocrResponse);
      return answer;
    }),
});


async function answerQuestion(question: string, ocrResponse) {
  // 1. retrieve relevant parts
  // 2. create augmented prompt
  // 3. get and return answer
  const input = parseOcrResponse(ocrResponse);
  const prompt = `Read the following document:\n\n${input}\n\n---\n\n` +
    `Based on the above, ${question}\n` +
    `Return just the answer, not a complete sentence, but do parse people's names.\n` +
    `Your answer should be in the following format:\nAnswer: {answer}\nReason: "{reason}"\n` +
    `Fill in {reason} with a direct quote from the document that supports your answer. Do not add anything else except the direct quote.`;
  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: 'user', "content": prompt }],
    model: 'gpt-3.5-turbo',
  });
  const messageContent = chatCompletion.choices[0]?.message.content;
  return messageContent;
}

function parseOcrResponse(ocrResponse) {
  return ocrResponse.result.chunks
    .map(chunk => chunk.blocks.map(block => block.content).join('\n'))
    .join('\n');
}

