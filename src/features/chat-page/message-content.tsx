"use client";
import { Markdown } from "@/features/ui/markdown/markdown";
import { FunctionSquare } from "lucide-react";
import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { RecursiveUI } from "../ui/recursive-ui";
import { CitationAction } from "./citation/citation-action";

interface MessageContentProps {
  message: {
    role: string;
    content: string | any; // Accepts parsed or stringified JSON
    name: string;
    multiModalImage?: string;
  };
}

const replaceCitationsWithLinks = (
    text: string,
    citations: { text: string; url_citation: { url: string; title: string } }[]
): string => {
  let result = text;
  citations.forEach((c) => {
    const link = `<a href="${c.url_citation.url}" title="${c.url_citation.title}" target="_blank" rel="noopener noreferrer">${c.url_citation.title}</a>`;
    result = result.replace(c.text, link);
  });
  return result;
};

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  if (message.role === "assistant" || message.role === "user") {
    let parsedAnswer: string | null = null;
    let parsedCitations: { text: string; url_citation: { url: string; title: string } }[] = [];

    try {
      const parsed = typeof message.content === "string"
          ? JSON.parse(message.content)
          : message.content;

      if (typeof parsed.answer === "string") parsedAnswer = parsed.answer;
      if (Array.isArray(parsed.citations)) parsedCitations = parsed.citations;
    } catch {}

    return (
        <>
          {parsedAnswer ? (
              <div className="prose dark:prose-invert max-w-none space-y-4">
                <p>{parsedAnswer.replace(/【.*?†source】/g, "")}</p>

                {parsedCitations.length > 0 && (
                    <div>
                      <strong>Quellen:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {parsedCitations.map((c, i) => (
                            <li key={i}>
                              <a
                                  href={c.url_citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline"
                              >
                                {c.url_citation.title}
                              </a>
                            </li>
                        ))}
                      </ul>
                    </div>
                )}
              </div>
          ) : typeof message.content === "string" &&
          !message.content.trim().startsWith("{") ? (
              <Markdown content={message.content} onCitationClick={CitationAction} />
          ) : (
              <p className="text-muted-foreground text-sm italic">
                ⚠️ Keine darstellbare Antwort
              </p>
          )}

          {message.multiModalImage && <img src={message.multiModalImage} />}
        </>
    );
  }

  if (message.role === "tool" || message.role === "function") {
    return (
        <div className="py-3">
          <Accordion
              type="multiple"
              className="bg-background rounded-md border p-2"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-sm py-1 items-center gap-2">
                <div className="flex gap-2 items-center">
                  <FunctionSquare
                      size={18}
                      strokeWidth={1.4}
                      className="text-muted-foreground"
                  />
                  Show {message.name} {message.name === "tool" ? "output" : "function"}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <RecursiveUI documentField={toJson(message.content)} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
    );
  }

  return null;
};


const toJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

export default MessageContent;
