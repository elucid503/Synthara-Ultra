import { DiscordEmbed } from "../../structures/apis/embeds";

/**
 * This function posts a message to a Discord webhook URL.
 * 
 * @param url - The Discord webhook URL.
 * @param embeds - An array containing at least one and at most 10 DiscordEmbed objects.
 * 
 * @returns A promise that resolves to a boolean indicating if the message was sent or not.
*/

export async function PostToWebhook(url: string, embeds: DiscordEmbed[]): Promise<boolean> { 

    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ embeds: embeds }),
        headers: { "Content-Type": "application/json" },
    }).catch(() => { 
        return null;
    });    

    if (!response) return false;

    return response.ok;

}