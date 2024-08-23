"use client";

import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type PdfHighlight = {
  pageNumber: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Bbox = {
  top: number;
  left: number;
  page: number;
  width: number;
  height: number;
}

export interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

type PdfViewerProps = {
  url: string;
  pdfViewerRef?: Ref<PdfViewerHandle | undefined>;
  highlight?: Bbox;
};

const PdfViewer = ({ url, pdfViewerRef, highlight }: PdfViewerProps) => {
  useImperativeHandle(pdfViewerRef, () => ({
    scrollToPage: (pageNumber) => {
      pageRefs.current[pageNumber - 1]?.scrollIntoView({
        behavior: "smooth",
      });
    },
  }));

  const [numPages, setNumPages] = useState(0);

  const pageRefs = useRef<(HTMLDivElement | null)[]>(
    Array<null>(numPages).fill(null),
  );

  useEffect(() => {
    pageRefs.current = Array<null>(numPages).fill(null);
  }, [numPages]);

  return (
    <Document
      className="document"
      file={url}
      onLoadSuccess={({ numPages }) => {
        setNumPages(numPages);
      }}
      loading={<div>Loading…</div>}
    >
      {Array.from(new Array(numPages), (el, index) => (
        <Page
          key={`page_${index + 1}`}
          pageNumber={index + 1}
          className="h-full w-full"
          width={undefined}
          height={undefined}
        />
      ))}
      {highlight &&
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'yellow',
            opacity: 0.5,
            left: `${highlight.left * 100}%`,
            top: `${highlight.top * 100}%`,
            width: `${highlight.width * 100}%`,
            height: `${highlight.height * 100}%`,
          }}
        />
      }
    </Document>
  );
};

export default PdfViewer;
