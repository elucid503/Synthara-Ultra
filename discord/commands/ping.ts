import { CommandInteraction } from "@projectdysnomia/dysnomia";

import { SlashCommandHandlerData } from "../../structures/handlers/commands";
import { CreateEmbed } from "../../structures/apis/embeds";
import { ReplyToCmdInteraction } from "../../structures/apis/interactions";

export default <SlashCommandHandlerData>{
    
    DiscordAPICommand: {

        type: 1,
        name: "ping",
        description: "Pong!"

    },

    RateLimit: null,

    Restrictions: {

        developer: false,
        guild: false

    },

    Executable: async (Ctx: CommandInteraction) => {

        const Embed = CreateEmbed({ title: "Pong!", description: "No latency data provided yet." });

        await ReplyToCmdInteraction(Ctx, { embeds: [Embed], ephemeral: true });
        
    }

};