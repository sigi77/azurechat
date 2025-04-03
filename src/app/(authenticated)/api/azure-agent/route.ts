// src/app/api/azure-agent/route.ts
import { NextResponse } from "next/server";
import { runAzureAgent } from "@/features/chat-page/chat-services/azure-agent-service";

export async function POST(req: Request) {
    const body = await req.json();
    const userInput = body.message as string;

    if (!userInput) {
        return NextResponse.json({ error: "Kein Text übergeben." }, { status: 400 });
    }

    try {
        const agentAnswer = await runAzureAgent(userInput);
        return NextResponse.json({ answer: agentAnswer });
    } catch (err) {
        console.error("Azure-Agent-Fehler:", err);
        return NextResponse.json({ error: "Fehler bei der Agent-Kommunikation." }, { status: 500 });
    }
}
