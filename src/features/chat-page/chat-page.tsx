"use client";
import { ChatInput } from "@/features/chat-page/chat-input/chat-input";
import { chatStore, useChat } from "@/features/chat-page/chat-store";
import { ChatLoading } from "@/features/ui/chat/chat-message-area/chat-loading";
import { ChatMessageArea } from "@/features/ui/chat/chat-message-area/chat-message-area";
import ChatMessageContainer from "@/features/ui/chat/chat-message-area/chat-message-container";
import ChatMessageContentArea from "@/features/ui/chat/chat-message-area/chat-message-content";
import { useChatScrollAnchor } from "@/features/ui/chat/chat-message-area/use-chat-scroll-anchor";
import { useSession } from "next-auth/react";
import { FC, useEffect, useRef } from "react";
import { ExtensionModel } from "../extensions-page/extension-services/models";
import { ChatHeader } from "./chat-header/chat-header";
import {
  ChatDocumentModel,
  ChatMessageModel,
  ChatThreadModel,
} from "./chat-services/models";
import MessageContent from "./message-content";

interface ChatPageProps {
  messages: Array<ChatMessageModel>;
  chatThread: ChatThreadModel;
  chatDocuments: Array<ChatDocumentModel>;
  extensions: Array<ExtensionModel>;
}

export const ChatPage: FC<ChatPageProps> = (props) => {
  const { data: session } = useSession();

  useEffect(() => {
    chatStore.initChatSession({
      chatThread: props.chatThread,
      messages: props.messages,
      userName: session?.user?.name!,
    });
  }, [props.messages, session?.user?.name, props.chatThread]);

  const { messages, loading } = useChat();

  const current = useRef<HTMLDivElement>(null);

  useChatScrollAnchor({ ref: current });

  return (
    <main className="flex flex-1 relative flex-col">
      <ChatHeader
        chatThread={props.chatThread}
        chatDocuments={props.chatDocuments}
        extensions={props.extensions}
      />
      <ChatMessageContainer ref={current}>
        <ChatMessageContentArea>
          {messages.map((message) => {
            return (
              <ChatMessageArea
                key={message.id}
                profileName={message.name}
                role={message.role}
                onCopy={() => {
                  console.log("📋 Inhalt von message.content:", message.content);

                  let content: unknown = message.content;
                  let copyText = "";

                  try {
                    // Wenn content ein Objekt ist und ein "answer"-Feld hat:
                    if (
                        typeof content === "object" &&
                        content !== null &&
                        "answer" in content &&
                        typeof (content as any).answer === "string"
                    ) {
                      copyText = (content as any).answer;
                    }
                    // Wenn content ein JSON-String ist:
                    else if (typeof content === "string") {
                      const parsed = JSON.parse(content);
                      if (parsed?.answer && typeof parsed.answer === "string") {
                        copyText = parsed.answer;
                      } else {
                        copyText = content;
                      }
                    } else {
                      copyText = String(content);
                    }
                  } catch (err) {
                    console.warn("⚠️ Fehler beim Parsen:", err);
                    copyText = typeof content === "string" ? content : String(content);
                  }

                  navigator.clipboard.writeText(copyText);
                }}

                profilePicture={
                  message.role === "assistant"
                    ? "/Boeni.png"
                    : session?.user?.image
                }
              >
                <MessageContent message={message} />
              </ChatMessageArea>
            );
          })}
          {loading === "loading" && <ChatLoading />}
        </ChatMessageContentArea>
      </ChatMessageContainer>
      <ChatInput />
    </main>
  );
};
