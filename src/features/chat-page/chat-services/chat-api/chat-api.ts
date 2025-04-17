"use server";
import "server-only";

import { getCurrentUser } from "@/features/auth-page/helpers";
import { CHAT_DEFAULT_SYSTEM_PROMPT } from "@/features/theme/theme-config";
import { ChatCompletionStreamingRunner } from "openai/resources/beta/chat/completions";
import { ChatApiRAG } from "../chat-api/chat-api-rag";
import { FindAllChatDocuments } from "../chat-document-service";
import {
  CreateChatMessage,
  FindTopChatMessagesForCurrentUser,
} from "../chat-message-service";
import { EnsureChatThreadOperation } from "../chat-thread-service";
import { ChatThreadModel, UserPrompt } from "../models";
import { mapOpenAIChatMessages } from "../utils";
import { GetDefaultExtensions } from "./chat-api-default-extensions";
import { GetDynamicExtensions } from "./chat-api-dynamic-extensions";
import { ChatApiExtensions } from "./chat-api-extension";
import { ChatApiMultimodal } from "./chat-api-multimodal";
import { OpenAIStream } from "./open-ai-stream";
import { AzureAgentStream } from "./azure-agent-stream";

// 🆕 Azure Agent Import
import { runAzureAgent } from "../azure-agent-service";

type ChatTypes = "extensions" | "chat-with-file" | "multimodal";

export const ChatAPIEntry = async (props: UserPrompt, signal: AbortSignal) => {
  const currentChatThreadResponse = await EnsureChatThreadOperation(props.id);

  if (currentChatThreadResponse.status !== "OK") {
    return new Response("", { status: 401 });
  }

  const currentChatThread = currentChatThreadResponse.response;
  console.log("✅ Message created:", props.message)
  const [user, history, docs, extension] = await Promise.all([
    getCurrentUser(),
    _getHistory(currentChatThread),
    _getDocuments(currentChatThread),
    _getExtensions({
      chatThread: currentChatThread,
      userMessage: props.message,
      signal,
    }),
  ]);
  await CreateChatMessage({
    name: user.name,
    content: props.message,
    role: "user",
    chatThreadId: currentChatThread.id,
    multiModalImage: props.multimodalImage,
  });

  //props.agent = "azure-agent";
  console.log("Agents", props.agent)
  // 🆕 Wenn explizit Azure-Agent gewählt wurde, leite Anfrage direkt an diesen Agent weiter
  if (props.agent === "azure-agent") {
    const agentResponse = await runAzureAgent(props.message);

    const readableStream = AzureAgentStream({
      agentResponse,
      chatThreadId: currentChatThread.id,
    });

    return new Response(readableStream, {
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    });
  }

  // 👇 Nur wenn kein Azure-Agent verwendet wird, normale Logik mit GPT:

// console.log("hier");
  currentChatThread.personaMessage = `${CHAT_DEFAULT_SYSTEM_PROMPT} \n\n ${currentChatThread.personaMessage}`;

  let chatType: ChatTypes = "extensions";

  if (props.multimodalImage && props.multimodalImage.length > 0) {
    chatType = "multimodal";
  } else if (docs.length > 0) {
    chatType = "chat-with-file";
  } else if (extension.length > 0) {
    chatType = "extensions";
  }



  let runner: ChatCompletionStreamingRunner;

  switch (chatType) {
    case "chat-with-file":
      runner = await ChatApiRAG({
        chatThread: currentChatThread,
        userMessage: props.message,
        history: history,
        signal: signal,
        temperature: props.temperature,
      });
      break;
    case "multimodal":
      runner = ChatApiMultimodal({
        chatThread: currentChatThread,
        userMessage: props.message,
        file: props.multimodalImage,
        signal: signal,
        temperature: props.temperature,
      });
      break;
    case "extensions":
      runner = await ChatApiExtensions({
        chatThread: currentChatThread,
        userMessage: props.message,
        history: history,
        extensions: extension,
        signal: signal,
        temperature: props.temperature,
      });
      break;
  }

  const readableStream = OpenAIStream({
    runner: runner,
    chatThread: currentChatThread,
  });

  return new Response(readableStream, {
    headers: {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream"
    },
  });
};

/*const _getHistory = async (chatThread: ChatThreadModel) => {
  const historyResponse = await FindTopChatMessagesForCurrentUser(chatThread.id);

  if (historyResponse.status === "OK") {
    const historyResults = historyResponse.response;
    return mapOpenAIChatMessages(historyResults).reverse();
  }

  console.error("🔴 Error on getting history:", historyResponse.errors);
  return [];
};*/

const _getHistory = async (chatThread: ChatThreadModel) => {
  const historyResponse = await FindTopChatMessagesForCurrentUser(chatThread.id);

  if (historyResponse.status === "OK") {
    const historyResults = historyResponse.response;
    const mapped = mapOpenAIChatMessages(historyResults).reverse();

    // 🛡 absichern, dass message.content immer string ist
    const safeHistory = mapped.map((msg) => ({
      ...msg,
      content: typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));

    return safeHistory;
  }

  console.error("🔴 Error on getting history:", historyResponse.errors);
  return [];
};


const _getDocuments = async (chatThread: ChatThreadModel) => {
  const docsResponse = await FindAllChatDocuments(chatThread.id);

  if (docsResponse.status === "OK") {
    return docsResponse.response;
  }

  console.error("🔴 Error on AI search:", docsResponse.errors);
  return [];
};

const _getExtensions = async (props: {
  chatThread: ChatThreadModel;
  userMessage: string;
  signal: AbortSignal;
}) => {
  const extension: Array<any> = [];

  const response = await GetDefaultExtensions({
    chatThread: props.chatThread,
    userMessage: props.userMessage,
    signal: props.signal,
  });
  if (response.status === "OK" && response.response.length > 0) {
    extension.push(...response.response);
  }

  const dynamicExtensionsResponse = await GetDynamicExtensions({
    extensionIds: props.chatThread.extension,
  });
  if (
      dynamicExtensionsResponse.status === "OK" &&
      dynamicExtensionsResponse.response.length > 0
  ) {
    extension.push(...dynamicExtensionsResponse.response);
  }

  return extension;
};
