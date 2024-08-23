import Head from "next/head";
import dynamic from "next/dynamic";
import { useState } from "react";


const PdfViewer = dynamic(() => import("~/components/pdf-viewer"), {
  ssr: false,
});

import { api } from "~/utils/api";

const questions = [
  "What is the accession number for this order?",
  "What is the ordering physician's name?",
  "What is the final diagnosis in this pathology report?",
];


type Response = {
  answer: string;
  block: string;
};

type Responses = Record<number, Response>;


export default function Home() {
  const askQuestionMutation = api.questions.askQuestion.useMutation();
  const [responses, setResponses] = useState<Responses>({});

  const handleAskQuestion = async (question: string, index: number) => {
    const response = await askQuestionMutation.mutateAsync({ question });
    setResponses((prevResponses) => ({
      ...prevResponses,
      [index]: response ?? { answer: "", block: "" },
    }));
  };

  return (
    <>
      <Head>
        <title>File QA</title>
      </Head>
      <main className="grid h-screen grid-rows-[auto,1fr] overflow-hidden">
        <div className="border-b p-2">
          <h1 className="text-xl">File question answerer</h1>
        </div>
        <div className="grid grid-cols-2 overflow-hidden">
          <div className="flex h-full flex-col overflow-auto">
            {questions.map((question, index) => (
              <div className="flex flex-col justify-between" key={index}>
                <span>{question}</span>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleAskQuestion(question, index)}
                  >
                    Ask
                  </button>
                </div>
                {responses[index] && (
                  <div className="mt-2 p-2 bg-gray-100 border rounded">
                    <div><strong>Answer:</strong> {responses[index].answer}</div>
                    <div><strong>Source:</strong> {responses[index].block}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="h-full overflow-auto border-l">
            <PdfViewer url="https://utfs.io/f/05a34942-00e4-4fca-ab41-ca6910165481-zhi7w2.pdf"
            // highlight={{
            //   top: 0.25254592299461365,
            //   left: 0.34265780448913574,
            //   page: 1,
            //   width: 0.3243371546268463,
            //   height: 0.015495497733354568,
            // }}
            />
          </div>
        </div>
      </main>
    </>
  );
}
