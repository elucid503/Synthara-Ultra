// Synthara Ultra Source Code

import { ActivityType, ApplicationCommandStructure, Client, ClientOptions, Constants } from "@projectdysnomia/dysnomia";
import { MongoClient, MongoClientOptions, ServerApiVersion } from "mongodb"; 

import fs from "fs/promises";

import { Log } from "./functions/utils/logging";
import { LoadConfig } from "./configs/ts/reader";
import { CommonColors, CreateEmbed } from "./structures/apis/embeds";
import { SlashCommandHandlerData } from "./structures/handlers/commands";
import { MessageComponentHandlerData, ParseComponentID } from "./structures/handlers/components";
import { ApplicationSlashCommand, ReplyToCmdInteraction, ReplyToCompInteraction } from "./structures/apis/interactions";

import { StartAPI } from "./web/backend/server";
import { PluralizeWord } from "./functions/utils/ui";
import { GetUser } from "./structures/database/user";
import { Notify } from "./functions/database/notifs";
import { Queue } from "./structures/flow/queue";

Log("Info", "Synthara Ultra", "Developed by Elucid and Sprout");

const CLIArgs = {

    RefreshCommands: process.argv.includes("--Refresh")

};

const Configs = {

    Main: await LoadConfig("main"),
    Keys: await LoadConfig("keys"),
    Users: await LoadConfig("users"),
    Database: await LoadConfig("database")

};

const RateLimits: Map<string, {

    CommandName: string | null,
    ComponentID: string | null,

    Timeout: number

}[]> = new Map();

if (!Configs.Main || !Configs.Keys || !Configs.Database) { 

    console.error("Failed to load neccessary configs to start.");
    process.exit(1);

}

Log("Info", "Initializing", `Running as version ${Configs.Main.Version.Backend}`);

StartAPI().catch((error) => {

    Log("Error", "Fatal: API Error", `Failed to start API: ${error.message}`);
    process.exit(1);
    
});

const MClient = new MongoClient(Configs.Database.Host, {
    
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    
    }

} as MongoClientOptions);

const Start = Date.now();

await MClient.connect().catch(async (error) => {

    await Log("Error", "Fatal: Database Error.", `Failed to connect to MongoDB. Error message: ${error.message}`);
    process.exit(1);

});

const DB = MClient.db();

Log("Info", "Connected to DB", `Connected to MongoDB in ${Date.now() - Start} ms.`);

export class SyntharaUltra extends Client { 

    Locked: boolean = false;

    Commands: Map<string, SlashCommandHandlerData> = new Map();
    Components: Map<string, MessageComponentHandlerData> = new Map();

    Queues: Map<string, Queue> = new Map();

    constructor(token: string, options?: ClientOptions) {

        super(token, options);

    }

}

const DClient = new SyntharaUltra(Configs.Keys.Discord[Configs.Main.Mode].Token, {

    gateway: { 

        intents: [Constants.Intents.guildMembers, Constants.Intents.guildVoiceStates, Constants.Intents.allNonPrivileged]

    }

});

const Commands = await fs.readdir("./discord/commands").catch((error) => { 

    Log("Error", "Fatal: Failed to load commands. (Read Dir Error)", error.message);
    process.exit(1);

});

const Components = await fs.readdir("./discord/components").catch((error) => { 

    Log("Error", "Fatal: Failed to load components. (Read Dir Error)", error.message);
    process.exit(1);

});

const Counters = {

    CommandsLoaded: 0,
    ComponentsLoaded: 0

};

for (const File of Commands.filter((file => file.endsWith(".ts")))) { 

    const Content = await import(`./discord/commands/${File}`).catch((error) => { 

        Log("Error", `Fatal: Failed to load ${File} command. (Import Error)`, error.message);
        process.exit(1);

    });

    const Command = Content.default as SlashCommandHandlerData;

    DClient.Commands.set(Command.DiscordAPICommand.name, Command);

    Counters.CommandsLoaded =+ 1;

}

for (const File of Components.filter((file => file.endsWith(".ts")))) {

    const Content = await import(`./discord/components/${File}`).catch((error) => {

        Log("Error", `Fatal: Failed to load ${File} component. (Import Error)`, error.message);
        process.exit(1);

    });

    const Component = Content.default as MessageComponentHandlerData;

    DClient.Components.set(Component.Group, Component);

    Counters.ComponentsLoaded = + 1;
    
}

Log("Info", "Command Handler", `Loaded ${Counters.CommandsLoaded} ${PluralizeWord("command", Counters.CommandsLoaded)} and ${Counters.ComponentsLoaded} ${PluralizeWord("component", Counters.ComponentsLoaded)}`);

DClient.connect().catch((error) => {

    Log("Error", "Fatal: Failed to connect to Discord.", error.message);
    process.exit(1);

});

DClient.once("ready", () => {

    Log("Info", "Logged In", `Logged in as ${DClient.user.username} (${DClient.user.id})`);

    DClient.editStatus("online", [{ name: Configs.Main?.Status.Text || "Unknown", type: Configs.Main?.Status.Type as ActivityType }]);

    if (CLIArgs.RefreshCommands) {

        const Commands: ApplicationSlashCommand[] = [];

        DClient.Commands.forEach((command) => {

            Commands.push(command.DiscordAPICommand);

        });

        DClient.bulkEditCommands(Commands as ApplicationCommandStructure[]).then(() => {

            Log("Info", "Commands", "Successfully refreshed commands.");

        }).catch((error) => {

            Log("Error", "Commands", `Failed to refresh commands. ${error.message}`);

        });

    }

});

DClient.on("guildCreate", async (Guild) => {

    Log("Info", "Joined Guild", `Synthara Ultra has been added to ${Guild.name} (${Guild.id})`);

});

DClient.on("guildDelete", async (Guild) => {

    Log("Info", "Left Guild", `Synthara Ultra has been removed from ${Guild.id}`);

});

DClient.on("interactionCreate", async (Ctx) => {

    if (Ctx.type == Constants.InteractionTypes.APPLICATION_COMMAND) {

        const Local = DClient.Commands.get(Ctx.data.name);

        if (!Local) {

            Log("Warning", "Command Not Found", `Received a request for, but failed to find command: ${Ctx.data.name}`);
            return;

        }

        if (Configs.Users?.Blacklisted.includes(Ctx.user?.id || "0")) {

            Log("Warning", "Blacklisted User", `Received a request for, but denied to execute command: ${Ctx.data.name}`);

            const ErrorEmbed = CreateEmbed({ title: "Request Denied", author: { name: "Abuse Prevention"}, description: "You are blacklisted from using Synthara Ultra.", color: CommonColors.Warning });

            ReplyToCmdInteraction(Ctx, {

                embeds: [ErrorEmbed],
                ephemeral: true

            });

            return;

        }

        if (Local.Restrictions.developer && !Configs.Users?.Developers.includes(Ctx.user?.id || "0")) {

            Log("Warning", "Command Denied", `Received a request for, but denied to execute command: ${Ctx.data.name}`);
            
            const ErrorEmbed = CreateEmbed({ title: "Command Restricted", author: { name: "Developer Only" }, description: "You do not have permission to execute this command.", color: CommonColors.Warning });

            ReplyToCmdInteraction(Ctx, {

                embeds: [ErrorEmbed],
                ephemeral: true

            });

            return;
        
        }

        if (Local.RateLimit) { 

            // Check active rate limits 

            const ActiveRateLimit = RateLimits.get(Ctx.user?.id || "0")?.find((rateLimit) => rateLimit.CommandName === Ctx.data.name);

            if (ActiveRateLimit && ActiveRateLimit.Timeout > Date.now()) {

                Log("Warning", "Command Rate Limited", `Received a request for, but denied to execute command: ${Ctx.data.name}`);

                const RemainingTime = Math.ceil((ActiveRateLimit.Timeout - Date.now()) / 1000);

                const ErrorEmbed = CreateEmbed({ title: "Try Again Later", author: { name: "Rate Limited" }, description: `You can use this command again in ${RemainingTime} ${PluralizeWord("second", RemainingTime)}.`, color: CommonColors.Warning });

                ReplyToCmdInteraction(Ctx, {

                    embeds: [ErrorEmbed],
                    ephemeral: true

                });

                return;

            }

            else { 

                // Remove the rate limit 

                RateLimits.set(Ctx.user?.id || "0", RateLimits.get(Ctx.user?.id || "0")?.filter((rateLimit) => rateLimit.CommandName !== Ctx.data.name) || []);

            }

        }

        Log("Info", "Command Executed", `Received a request for, and executed command: \`${Ctx.data.name}\``);

        Local.Executable(Ctx, DClient, DB).catch((error) => { 

            Log("Error", "Command Runtime Error", error.message);

            const ErrorEmbed = CreateEmbed({ title: "Something Went Wrong :(", author: { name: "Command Error" }, description: "Sorry, this command didn't work correctly.\nWe're on it and will have this fixed ASAP.", color: CommonColors.Error });

            ReplyToCmdInteraction(Ctx, {

                embeds: [ErrorEmbed],
                ephemeral: true

            });

        });

        if (Local.RateLimit) { 

            const ExistingRateLimit = RateLimits.get(Ctx.user?.id || "0");

            if (ExistingRateLimit) {

                RateLimits.set(Ctx.user?.id || "0", ExistingRateLimit.concat({
                    
                    CommandName: Ctx.data.name,
                    ComponentID: null,

                    Timeout: Date.now() + (Local.RateLimit * 1000)
                    
                }));

            }

            else {

                RateLimits.set(Ctx.user?.id || "0", [{
                
                    CommandName: Ctx.data.name,
                    ComponentID: null,

                    Timeout: Date.now() + (Local.RateLimit * 1000)
                
                }]);
                
            }

        }

        // Get user here

        if (Ctx.user?.id) { 

            const DBUser = await GetUser(DB, Ctx.user.id);

            Notify(DBUser, Ctx);

        }

    }

    else if (Ctx.type === Constants.InteractionTypes.MESSAGE_COMPONENT) { 

        const Parsed = ParseComponentID(Ctx.data.custom_id);

        if (Parsed.BaseID == "None") { 

            Log("Warning", "Component Not Found", `Received a request for, but failed to find component: \`${Ctx.data.custom_id}\``);
            return;

        }

        const Local = DClient.Components.get(Parsed.Group);
        
        if (!Local) {

            Log("Warning", "Component Not Found", `Received a request for, but failed to find component: ${Ctx.data.custom_id}`);
            return;

        }

        if (Configs.Users?.Blacklisted.includes(Ctx.user?.id || "0")) {

            Log("Warning", "Blacklisted User", `Received a request for, but denied to execute component: ${Ctx.data.custom_id}`);

            const ErrorEmbed = CreateEmbed({ title: "Request Denied", author: { name: "Abuse Prevention"}, description: "You are blacklisted from using Synthara Ultra.", color: CommonColors.Warning });

            ReplyToCompInteraction(Ctx, {

                embeds: [ErrorEmbed],
                ephemeral: true

            });

            return;

        }

        if (Local.Restrictions.Developer && !Configs.Users?.Developers.includes(Ctx.user?.id || "0")) {

            Log("Warning", "Component Denied", `Received a request for, but denied to execute component: ${Ctx.data.custom_id}`);
            
            const ErrorEmbed = CreateEmbed({ title: "Component Restricted", author: { name: "Developer Only"}, description: "You do not have permission to execute this component.", color: CommonColors.Warning });

            ReplyToCompInteraction(Ctx, {

                embeds: [ErrorEmbed],
                ephemeral: true

            });

            return;
        
        }

        const Mapped = Local.Components.find(component => component.ID === Parsed.BaseID);

        if (!Mapped) {

            Log("Warning", "Component Not Found", `Received a request for, but failed to find component: ${Ctx.data.custom_id}`);
            return;

        }

        if (Local.RateLimit) { 

            // Check active rate limits 

            const ActiveRateLimit = RateLimits.get(Ctx.user?.id || "0")?.find((rateLimit) => rateLimit.ComponentID === Ctx.data.custom_id);

            if (ActiveRateLimit && ActiveRateLimit.Timeout > Date.now()) {

                Log("Warning", "Component Rate Limited", `Received a request for, but denied to execute component: ${Ctx.data.custom_id}`);

                const RemainingTime = Math.ceil((ActiveRateLimit.Timeout - Date.now()) / 1000);

                const ErrorEmbed = CreateEmbed({ title: "Try Again Later", author: { name: "Rate Limited"}, description: `You can use this component again in ${RemainingTime} ${PluralizeWord("second", RemainingTime)}.`, color: CommonColors.Warning });

                ReplyToCompInteraction(Ctx, {

                    embeds: [ErrorEmbed],
                    ephemeral: true

                });

                return;

            }

            else { 

                // Remove the rate limit 

                RateLimits.set(Ctx.user?.id || "0", RateLimits.get(Ctx.user?.id || "0")?.filter((rateLimit) => rateLimit.ComponentID !== Ctx.data.custom_id) || []);

            }

        }

        Log("Info", "Component Executed", `Received a request for, and executed component: ${Ctx.data.custom_id}`);

        Mapped.Executable(Ctx, DClient, Parsed.Args, DB).catch((error) => {

            Log("Error", "Component Runtime Error", error.message);

            const ErrorEmbed = CreateEmbed({ title: "Something Went Wrong :(", author: { name: "Component Error" }, description: "Sorry, this component didn't work correctly.\nWe're on it and will have this fixed ASAP.", color: CommonColors.Error });

            ReplyToCompInteraction(Ctx, {

                embeds: [ErrorEmbed],
                ephemeral: true

            });

        });

        if (Local.RateLimit) { 

            const ExistingRateLimit = RateLimits.get(Ctx.user?.id || "0");

            if (ExistingRateLimit) {

                RateLimits.set(Ctx.user?.id || "0", ExistingRateLimit.concat({
                    
                    CommandName: null,
                    ComponentID: Ctx.data.custom_id,

                    Timeout: Date.now() + (Local.RateLimit * 1000)
                    
                }));

            }

            else {

                RateLimits.set(Ctx.user?.id || "0", [{
                
                    CommandName: null,
                    ComponentID: Ctx.data.custom_id,

                    Timeout: Date.now() + (Local.RateLimit * 1000)
                
                }]);
                
            }

        }

        if (Ctx.user?.id) { 

            const DBUser = await GetUser(DB, Ctx.user.id);

            Notify(DBUser, Ctx);

        }

    }

});

process.on("SIGINT", async () => {

    DClient.disconnect({ reconnect: false });

    await Log("Warning", "Process Exiting", "Disconnecting from Discord as the process has been killed.");

    process.exit(0);

});

process.on("uncaughtException", async (error) => {

    await Log("Error", "Uncaught Exception",  `An uncaught exception has occured: ${error.message}`);

});

DClient.on("error", async (error) => {
   
    await Log("Error", "Discord Client Error",  `A Discord API error has occured: ${error.message}`);
    
});  
