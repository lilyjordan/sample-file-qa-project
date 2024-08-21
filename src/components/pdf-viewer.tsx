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
  /**
   * The coordinates as % of the page
   */
  left: number;
  top: number;
  width: number;
  height: number;
};

export interface PdfViewerHandle {
  scrollToPage: (pageNumber: number) => void;
}

type PdfViewerProps = {
  url: string;
  pdfViewerRef?: Ref<PdfViewerHandle | undefined>;
};

const PdfViewer = ({ url, pdfViewerRef }: PdfViewerProps) => {
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
    // Re-initialize the refs array when numPages changes
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
    </Document>
  );
};

export default PdfViewer;
