import { AddExtension } from "@/features/extensions-page/add-extension/add-new-extension";
import { ExtensionCard } from "@/features/extensions-page/extension-card/extension-card";
import { ExtensionModel } from "@/features/extensions-page/extension-services/models";
import { PersonaCard } from "@/features/persona-page/persona-card/persona-card";
import { PersonaModel } from "@/features/persona-page/persona-services/models";
import { AI_DESCRIPTION, AI_NAME } from "@/features/theme/theme-config";
import { Hero } from "@/features/ui/hero";
import { ScrollArea } from "@/features/ui/scroll-area";
import Image from "next/image";
import { FC } from "react";

interface ChatPersonaProps {
  personas: PersonaModel[];
  extensions: ExtensionModel[];
}

export const ChatHome: FC<ChatPersonaProps> = (props) => {
  return (
    <ScrollArea className="flex-1">
      <main className="flex flex-1 flex-col gap-6 pb-6">
        <Hero
          title={
            <>
              <Image
                src={"/boeni.png"}
                width={60}
                height={60}
                quality={100}
                alt="ai-icon"
              />{" "}
              {AI_NAME}
            </>
          }
          description={AI_DESCRIPTION}
        ></Hero>
        <div className="container max-w-6xl flex gap-10 flex-row items-start">
          <div className="w-1/2">
            <h2 className="text-2xl font-bold mb-3">Meine Chat-Bots</h2>
            {props.personas && props.personas.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {props.personas.map((persona) => (
                      <PersonaCard persona={persona} key={persona.id} showContextMenu={false} />
                  ))}
                </div>
            ) : (
                <p className="text-muted-foreground max-w-xl">No personas created</p>
            )}
          </div>
          <div className="w-1/2">
            <h2 className="text-2xl font-bold mb-3">Chate über unsere Daten</h2>
            {props.extensions && props.extensions.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {props.extensions.map((extension) => (
                      <ExtensionCard extension={extension} key={extension.id} showContextMenu={false} />
                  ))}
                </div>
            ) : (
                <p className="text-muted-foreground max-w-xl">No extensions created</p>
            )}
          </div>


        </div>
        <AddExtension />
      </main>
    </ScrollArea>
  );
};
