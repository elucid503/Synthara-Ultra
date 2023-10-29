import { ActionRow, AnyInteraction, CommandInteraction, ComponentInteraction, Constants } from "@projectdysnomia/dysnomia";

import { ButtonActionRow } from "./components";
import { DiscordEmbed } from "./embeds";

import { SyntharaUltra } from "../../";

import { Log } from "../../functions/utils/logging";

export interface ApplicationSlashCommand {

    id?: string;
    type: number; // 1 for CHAT_INPUT, 2 for USER, 3 for MESSAGE
    application_id?: string;
    guild_id?: string; // Optional, only present for guild-specific commands
    name: string;
    description?: string; // Optional for type 2 and 3
    options?: ApplicationSlashCommandOption[]; // Optional
    default_permission?: boolean; // Optional
    version?: string;

}
  
interface ApplicationSlashCommandOption {

    type: number; // 1 for SUB_COMMAND, 2 for SUB_COMMAND_GROUP, 3 for STRING, etc.
    name: string;
    description: string;
    required?: boolean; // Optional
    choices?: ApplicationSlashCommandOptionChoice[]; // Optional
    options?: ApplicationSlashCommandOption[]; // Optional, for nested sub-commands and groups

}
  
interface ApplicationSlashCommandOptionChoice {

    name: string;
    value: string | number;
    
}

/**
 * This function replys to a slash command interaction.
 * For clarification, this checks if the interaction is already deferred, and edits the reply if so.
 * 
 * @param interaction - The slash command interaction for context.
 * @param options - Reply options that include content, components, embeds, and an ephemeral flag.
 * 
 * @returns A promise that resolves to a boolean indicating if the reply was sent or not.
*/
  
export async function ReplyToCmdInteraction(interaction: CommandInteraction, options: { embeds?: DiscordEmbed[], content?: string, ephemeral?: boolean, components?: (ButtonActionRow)[] }): Promise<boolean> { 

    if (interaction.acknowledged) {

        return await interaction.editOriginalMessage({ embeds: options.embeds, content: options.content, components: options.components as ActionRow[] }).then(() => { return true; }).catch((error) => {
        
            Log("Warning", "Discord API Error", `Failed to edit original interaction ${interaction.id} in ${interaction.guildID ? `guild ${interaction.guildID}` : "DMs"}: ${error}`);
            return false;
    
        });

    }

    else {

        return await interaction.createMessage({ embeds: options.embeds, content: options.content, flags: options.ephemeral ? 64 : undefined, components: options.components as ActionRow[] }).then(() => { return true; }).catch((error) => {
        
            Log("Warning", "Discord API Error", `Failed to reply to command interaction ${interaction.id} in ${interaction.guildID ? `guild ${interaction.guildID}` : "DMs"}: ${error}`);
            return false;

        });
        
    }

}

/**
 * This function follows up from a message component interaction.
 * For clarification, this checks if the interaction is already deferred, and edits the reply if so.
 * 
 * @param interaction - The message component interaction for context.
 * @param options - Reply options that include content, components, embeds, and an ephemeral flag.
 * 
 * @returns A promise that resolves to a boolean indicating if the followup msg was sent or not.
*/
  
export async function ReplyToCompInteraction(interaction: ComponentInteraction, options: { embeds?: DiscordEmbed[], content?: string, ephemeral?: boolean, components?: ButtonActionRow[] }): Promise<boolean> { 

    if (!interaction.acknowledged) {

        const DResp = await interaction.deferUpdate().catch((error) => { 
        
            Log("Warning", "Discord API Error", `Failed to defer component interaction ${interaction.id} in ${interaction.guildID ? `guild ${interaction.guildID}` : "DMs"}: ${error}`);
            return false;

        });

        if (!DResp) { return false; }

    }

    return await interaction.createFollowup({ embeds: options.embeds, content: options.content, flags: options.ephemeral ? 64 : undefined, components: options.components as ActionRow[] }).then(() => { return true; }).catch((error) => {
    
        Log("Warning", "Discord API Error", `Failed to follow up to component interaction ${interaction.id} in ${interaction.guildID ? `guild ${interaction.guildID}` : "DMs"}: ${error}`);
        return false;

    });

}

/**
 * This function awaits an interaction tied to a specific message ID.
 *  * 
 * @param client - The SyntharaUltra client, needed as event listeners are used.
 * @param messageID - The messageID tied to the interaction we're looking for.
 * @param timeout - The timeout in milliseconds before the promise resolves to null.
 * 
 * @returns A promise that resolves to a ComponentInteraction or null, depending on the timeout.
*/

export async function AwaitOneInteractionFromMessage(client: SyntharaUltra, messageID: string, timeout: number): Promise<ComponentInteraction | null> {

    return await new Promise((resolve) => {

        const Timeout = setTimeout(() => {
            
            client.off("interactionCreate", InteractionHandler);
            resolve(null);

        }, timeout);

        const InteractionHandler = (interaction: AnyInteraction) => {

            if (interaction.type == Constants.InteractionTypes.MESSAGE_COMPONENT) {

                if (interaction.message.id == messageID) {

                    clearTimeout(Timeout);

                    client.off("interactionCreate", InteractionHandler);
                    resolve(interaction);

                }

            }
    
        };

        client.on("interactionCreate", InteractionHandler); // This will be removed by the Timeout if it isn't resolved before then.

    });

}