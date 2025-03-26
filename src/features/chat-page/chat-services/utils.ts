import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionFunctionMessageParam,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { ChatMessageModel } from "./models";

export const mapOpenAIChatMessages = (
  messages: ChatMessageModel[]
): ChatCompletionMessageParam[] => {
  return messages.map((message) => {
    switch (message.role) {
      case "function":
        return {
          role: message.role,
          name: message.name,
          content: message.content,
        } as ChatCompletionFunctionMessageParam;
      case "assistant":
        return {
          role: message.role,
          content: message.content,
        } as ChatCompletionAssistantMessageParam;
      default:
        return {
          role: message.role,
          content: message.content,
        } as ChatCompletionMessageParam;
    }
  });
};

// 🔧 Entfernt alle Embedding-Felder aus einem Dokument, selber ergänzt
export function removeEmbeddingsFromDocument<T extends object>(
    doc: T,
    embeddingFields: string[]
): T {
  const cleanedDoc = { ...doc };
  for (const field of embeddingFields) {
    delete cleanedDoc[field as keyof T];
  }
  return cleanedDoc;
}

