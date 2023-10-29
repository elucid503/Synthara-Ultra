import { CommonColors, CreateEmbed } from "../../structures/apis/embeds";
import { PostToWebhook } from "../apis/webhook";

import { LoadConfig } from "../../configs/ts/reader";

const keys = await LoadConfig("keys");
const ui = await LoadConfig("ui");

/**
 * This function logs a message both to the console and to Discord.
 * 
 * @param level - How severe / urgent the log is.
 * @param title - The title of the log.
 * @param message - The message of the log.
 * @param local - Whether or not to log locally only.
 * 
 * @returns A promise that resolves to nothing, usually is not checked or needed to be checked.
*/

export async function Log(level: "Info" | "Warning" | "Error", title: string, message: string, local: boolean = false): Promise<void> { 

    process.stdout.write(`${level.toUpperCase()} • ${title} • ${message}\n`);

    if (!keys || !ui) {

        console.error("Config Error: configs for logging not found");
        return;

    }

    let Color = ui.Embeds.Color;

    if (level === "Warning") Color = CommonColors.Warning;
    if (level === "Error") Color = CommonColors.Error;

    const Embed = CreateEmbed({

        title: title,
        color: Color,
        description: message,
        author: { name: `New ${level} Outputted` },
        footer: { text: ui.Embeds.Footer.Text, icon_url: ui.Embeds.Footer.Icon }

    });

    if (!local && keys) { 

        const response = await PostToWebhook(keys.Discord.Webhooks.Logging, [Embed]);

        if (!response) { console.log("Failed to send log to Discord"); }

    }

}