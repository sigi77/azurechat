import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

const ENDPOINT = "https://swedencentral.api.azureml.ms";
const SUBSCRIPTION_ID = "5b8eb722-f96b-48d1-bb27-f5e5484341d3";
const RESOURCE_GROUP = "rg-azure-chat";
const PROJECT = "it-3567";
const AGENT_ID = "asst_SLWnwzPvjT1fcMjsJ01KjvHG";

// Optional: Minimale Typdefinition, um den Fehler TS2339 zu verhindern
// ohne weitere Dateien anpassen zu müssen
interface AgentTextContent {
    value: string;
    annotations?: {
        type: string;
        text: string;
        url_citation?: {
            url: string;
            title: string;
        };
    }[];
}

interface AgentTextBlock {
    type: string;
    text: AgentTextContent;
}

export async function runAzureAgent(userInput: string): Promise<string> {
    const client = new AIProjectsClient(
        ENDPOINT,
        SUBSCRIPTION_ID,
        RESOURCE_GROUP,
        PROJECT,
        new DefaultAzureCredential()
    );

    const agent = await client.agents.getAgent(AGENT_ID);
    const thread = await client.agents.createThread();

    await client.agents.createMessage(thread.id, {
        role: "user",
        content: `Please answer .

${userInput}`,
    });

    let run = await client.agents.createRun(thread.id, agent.id);

    while (["queued", "in_progress"].includes(run.status)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        run = await client.agents.getRun(thread.id, run.id);
    }

    const messages = await client.agents.listMessages(thread.id);
    const last = messages.data.reverse().find((m: any) => m.role === "assistant");

    const firstBlock = last?.content?.[0] as AgentTextBlock;

    const answer = firstBlock?.text?.value ?? "(keine Antwort vom Agenten)";
    const citations = firstBlock?.text?.annotations ?? [];

    console.log("📎 Gefundene Antwort:", answer);
    console.log("🔗 Gefundene Annotations:", citations);

    return JSON.stringify({ answer, citations });
}
