import Head from "next/head";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("~/components/pdf-viewer"), {
  ssr: false,
});

import { api } from "~/utils/api";

const questions = [
  "What the accession number for this order?",
  "What is the ordering physician's name?",
  "What is the final diagnosis in this pathology report?",
];

export default function Home() {
  const askQuestionMutation = api.questions.askQuestion.useMutation();

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
              <div className="flex justify-between" key={index}>
                <span>{question}</span>
                <button
                  onClick={async () => {
                    const response = await askQuestionMutation.mutateAsync({
                      question,
                    });
                    alert(response);
                  }}
                >
                  Ask
                </button>
              </div>
            ))}
          </div>
          <div className="h-full overflow-auto border-l">
            <PdfViewer url="https://utfs.io/f/05a34942-00e4-4fca-ab41-ca6910165481-zhi7w2.pdf" />
          </div>
        </div>
      </main>
    </>
  );
}
