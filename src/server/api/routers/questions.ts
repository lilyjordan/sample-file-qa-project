import { z } from "zod";
import { ocrResponse } from "~/constants";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const questionsRouter = createTRPCRouter({
  askQuestion: publicProcedure
    .input(z.object({ question: z.string().min(1) }))
    .mutation(async ({ input }) => {
      console.log(ocrResponse);
      return "answer";
    }),
});
