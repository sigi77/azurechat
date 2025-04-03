import { AI_NAME } from "@/features/theme/theme-config";
import { CreateChatMessage } from "../chat-message-service";
import { AzureChatCompletion } from "../models";

export const AzureAgentStream = (props: {
    agentResponse: string;
    chatThreadId: string;
}) => {
    const encoder = new TextEncoder();
    const { agentResponse, chatThreadId } = props;

    const readableStream = new ReadableStream({
        async start(controller) {
            const streamResponse = (event: string, value: string) => {
                controller.enqueue(encoder.encode(`event: ${event} \n`));
                controller.enqueue(encoder.encode(`data: ${value} \n\n`));
            };

            // Event-Typen konsistent mit OpenAIStream
            const response: AzureChatCompletion = {
                type: "finalContent",
                response: agentResponse,
            };

            // Optional: vorher noch "content" senden
            streamResponse("content", JSON.stringify({
                type: "content",
                response: {
                    choices: [{ message: { content: agentResponse } }],
                }
            }));

            // finale Message + Speicherung
            await CreateChatMessage({
                name: AI_NAME,
                content: agentResponse,
                role: "assistant",
                chatThreadId,
            });
            console.log("In Azure agent stream", response);
            streamResponse("finalContent", JSON.stringify(response));
            controller.close();
        },
    });

    return readableStream;
};
