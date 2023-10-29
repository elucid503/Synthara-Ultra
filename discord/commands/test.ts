import { AnyVoiceChannel, CommandInteraction } from "@projectdysnomia/dysnomia";

import { SlashCommandHandlerData } from "../../structures/handlers/commands";
import { Queue } from "../../structures/flow/queue";
import { SyntharaUltra } from "../..";

export default <SlashCommandHandlerData>{
    
    DiscordAPICommand: {

        type: 1,
        name: "test",
        description: "Test command used for various actions."

    },

    RateLimit: null,

    Restrictions: {

        developer: true,
        guild: false

    },

    Executable: async (Ctx: CommandInteraction, Client: SyntharaUltra) => {

        const channelID = Ctx.member?.voiceState?.channelID;

        if (!channelID) return Ctx.createMessage("You must be in a voice channel to use this command.");

        const channel = Client.getChannel(channelID) as AnyVoiceChannel;

        const queue = new Queue(Ctx.guildID!);

        await queue.Connect(Ctx.channel!, channel);

    }

};