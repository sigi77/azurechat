"use client";

import {
  ChatDocumentModel,
  ChatMessageModel,
} from "@/features/chat-page/chat-services/models";
import { ChatMessageArea } from "@/features/ui/chat/chat-message-area/chat-message-area";
import ChatMessageContainer from "@/features/ui/chat/chat-message-area/chat-message-container";
import ChatMessageContentArea from "@/features/ui/chat/chat-message-area/chat-message-content";
import MessageContent from "../chat-page/message-content";

interface ReportingChatPageProps {
  messages: Array<ChatMessageModel>;
  chatDocuments: Array<ChatDocumentModel>;
}

export default function ReportingChatPage(props: ReportingChatPageProps) {
  return (
    <main className="flex flex-1 relative flex-col">
      <ChatMessageContainer>
        <ChatMessageContentArea>
          {props.messages.map((message) => {
            return (
              <ChatMessageArea
                key={message.id}
                profileName={message.name}
                role={message.role}
                onCopy={() => {
                  //navigator.clipboard.writeText(message.content);
                  console.log("📋 Inhalt von message.content:", message.content);

                  const raw = message.content;

                  let copyText = raw;

                  try {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed.answer === "string") {
                      copyText = parsed.answer;
                    }
                  } catch {
                    // Ignorieren – ist kein JSON, dann einfach originalen Inhalt verwenden
                  }

                  navigator.clipboard.writeText(copyText);
                }}
                profilePicture={
                  message.role === "assistant" ? "/Boeni.png" : undefined
                }
              >
                <MessageContent message={message} />
              </ChatMessageArea>
            );
          })}
        </ChatMessageContentArea>
      </ChatMessageContainer>
    </main>
  );
}
