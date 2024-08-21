## PDF Q&A project

Thanks for interviewing with Sample 😊

In this interview, we'll be building a webpage that allows users to answer questions about a PDF with LLMs. The aim of this project is to give you a sense of the type of things we'd build at Sample, as well as give us a sense of how you build a project end-to-end with ambiguity.

Some notes before we get started:

- You can treat me like a technical PM on the job
- Feel free to use _any_ online resource including ChatGPT/LLMs

Our user wants questions to be answered from their document. On top of answers, they'd like to be able to review answers with relevant sources. Since LLMs can sometimes be wrong, it's important that the review process is effective & quick.

Our first priority is to get to an MVP that users could test. After that, you can focus on any area you'd like. Some possibilities include:

- Design & UI
- Distributed systems/job queuing
- Extending functionality with new features

### Getting started

To get started, you can install the dependencies with `npm install`, and run `npm run dev`. This will launch our frontend/backend dev server.

You'll primarily be working in `src/pages/index.tsx` for the UI, and `src/server/api/routers/questions.ts` for our backend.

In `src/server/api/routers/questions.ts`, you'll see a mutation that's called `answerQuestion`. You'll be writing a simple RAG pipeline here.

### Resources

- https://www.acorn.io/resources/learning-center/retrieval-augmented-generation

The basic idea will be to retrieve the relevant sources from the user's document based on a metric (usually cosine similarity), and then pass those sources into an LLM to generate a response. We can prompt the LLM to return the sources that we should show to the user.

We'll be using OpenAI as our frontier model provider for this exercise. We can use any embedding model + any generation model to get responses. We highly recommend using [the structured output mode](https://platform.openai.com/docs/guides/structured-outputs/introduction?lang=node.js) when useful.

### Embeddings

You can store & search embeddings locally. You can use a KD tree library or a local vector database of your choice. [Here's an example](https://github.com/golbin/imvectordb), but feel free to pick anything you'd like.
