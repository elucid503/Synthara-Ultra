import { Db } from "mongodb";
import { CommandInteraction } from "@projectdysnomia/dysnomia";

import { SyntharaUltra } from "../../";

import { ApplicationSlashCommand } from "../apis/interactions";

export interface SlashCommandHandlerData { 

    DiscordAPICommand: ApplicationSlashCommand;

    Restrictions: {

        developer: boolean;
        guild: boolean;

    },

    RateLimit: number | null;

    Executable: (Ctx: CommandInteraction, Client: SyntharaUltra, DB: Db) => Promise<void>;

}
