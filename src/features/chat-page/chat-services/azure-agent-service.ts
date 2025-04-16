import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

const ENDPOINT = "https://swedencentral.api.azureml.ms";
const SUBSCRIPTION_ID = "5b8eb722-f96b-48d1-bb27-f5e5484341d3";
const RESOURCE_GROUP = "rg-azure-chat";
const PROJECT = "it-3567";
const AGENT_ID = "asst_SLWnwzPvjT1fcMjsJ01KjvHG";

export async function runAzureAgent(userInput: string): Promise<string> {
    const client = new AIProjectsClient(
        ENDPOINT,
        SUBSCRIPTION_ID,
        RESOURCE_GROUP,
        PROJECT,
        new DefaultAzureCredential()
    );

    const agent = await client.agents.getAgent(AGENT_ID);
    // @ts-ignore
    const thread = await client.agents.createThread(agent.id);

    await client.agents.createMessage(thread.id, {
        role: "user",
        content: `Please answer and always cite your sources using markdown links like [NZZ](https://nzz.ch).\n\n${userInput}`,
        //content: userInput,
    });

    let run = await client.agents.createRun(thread.id, agent.id);

    while (["queued", "in_progress"].includes(run.status)) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        run = await client.agents.getRun(thread.id, run.id);
    }

    const messages = await client.agents.listMessages(thread.id);
    console.dir(messages.data, { depth: null });
    const last = messages.data.reverse().find((m: any) => m.role === "assistant");

    console.log("📎 Gefundene Antwort:", last?.content?.[0]?.text?.value);
    console.log("🔗 Gefundene Annotations:", last?.content?.[0]?.text?.annotations);

    // @ts-ignore
    return {
        answer: last?.content?.[0]?.text?.value ?? "(keine Antwort vom Agenten)",
        citations: last?.content?.[0]?.text?.annotations ?? [],
    };
}
