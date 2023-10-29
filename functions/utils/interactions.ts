import { ComponentInteraction } from "@projectdysnomia/dysnomia";

import { SyntharaUltra } from "../..";

import { GetYesNoButtons } from "../../structures/apis/components";
import { CommonColors, CreateEmbed } from "../../structures/apis/embeds";

import { ParseComponentID } from "../../structures/handlers/components";
import { AwaitOneInteractionFromMessage } from "../../structures/apis/interactions";

export async function AskForConfirmation(client: SyntharaUltra, interaction: ComponentInteraction, options: { title: string, description: string }): Promise<boolean> {
    
    const EmbedToSend = CreateEmbed({

        title: options.title,
        description: options.description,

        author: { name: "Confirm Action" },

        color: CommonColors.Warning

    });

    const Message = await interaction.createFollowup({ embeds: [EmbedToSend], components: [GetYesNoButtons({ Prefix: "Confirm" })] });

    const Interaction = await AwaitOneInteractionFromMessage(client, Message.id, 60_000);

    if (!Interaction) { return false; }

    const Parsed = ParseComponentID(Interaction.data.custom_id);

    await interaction.deferUpdate();

    if (Parsed.BaseID === "yes") {
        
        return true;

    }

    else { 

        const EmbedToSend = CreateEmbed({

            title: "Cancelled Action",
            description: "This action was cancelled. No changes have been made.",
    
            author: { name: "Confirm Action" },
    
            color: CommonColors.Default
    
        });    

        await interaction.editMessage(Message.id, { 

            embeds: [EmbedToSend],

        });

        return false;

    }

}