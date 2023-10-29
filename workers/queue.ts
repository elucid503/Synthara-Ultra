// Imports from installed modules

import { Client, Constants, VoiceConnection } from "@projectdysnomia/dysnomia";

// Imports from std modules 

import { Readable } from "stream";
import { parentPort } from "worker_threads";

// Imports from local files

import { Log } from "../functions/utils/logging";
import { LoadConfig } from "../configs/ts/reader";

import {
    WorkerError,
    WorkerEvents,
    WorkerRequest,
    WorkerSendMessage,
    WorkerResponseMessage
} from "../structures/handlers/subsystem";

import { ErrorCode } from "../structures/utils/errors";
import { LogicalQueueEvents } from "../structures/flow/queue";

const KConfig = await LoadConfig("keys");
const GConfig = await LoadConfig("main");

function EmitEvent(Event: WorkerEvents | LogicalQueueEvents, Payload?: any): void { //eslint-disable-line @typescript-eslint/no-explicit-any
   
    parentPort?.postMessage({

        RequestID: "0", // 0 is the default ID for events
        Event: Event,
        Error: null,
    
        Data: Payload || null
    
    } satisfies WorkerResponseMessage);
    
}

async function WaitForVoiceConnectionReady(): Promise<void> {

    const timeout = Date.now() + 10_000;
  
    while (!Data.VoiceConnection?.ready) {

        if (Date.now() > timeout) {
          
            throw new Error("Voice connection timed out");
            
        }
        
        await new Promise((resolve) => setTimeout(resolve, 100));
        
    }

}

function ReturnError(RequestID: string | undefined, Error: WorkerError): void {

    parentPort?.postMessage({

        RequestID: RequestID || "0",
        Error: Error,

        Data: null

    } satisfies WorkerResponseMessage);

}

function ReturnToParent(RequestID: string | undefined, Data: any): void { //eslint-disable-line @typescript-eslint/no-explicit-any

    parentPort?.postMessage({

        RequestID: RequestID || "0",
        Error: null,
    
        Data: Data
    
    } satisfies WorkerResponseMessage);

}

interface SubsystemData { 

    Client: Client;

    Ready: boolean;

    VoiceConnection: VoiceConnection | null;

    CurrentResource: Readable | null;

}

const Data: SubsystemData = {

    Client: new Client(KConfig!.Discord[GConfig!.Mode].Token, { 

        gateway: {

            intents: [Constants.Intents.guildMembers, Constants.Intents.guildVoiceStates, Constants.Intents.allNonPrivileged]

        }

    }),

    Ready: false,

    VoiceConnection: null,

    CurrentResource: null
    
};

await Data.Client.connect().catch((error) => {

    Log("Error", "Subsystem Connection Error", `Error connecting to Discord and initiating client: ${error}`);
    process.exit(1);

});

Data.Client.once("ready", () => {

    Data.Ready = true;

    Log("Info", "Subsystem Connection", "A subsystem has connected and is ready to receive commands.");

});

// Emit the "Started" event

EmitEvent(WorkerEvents.Started);

// Handle incoming messages

parentPort?.on("message", async (Message: WorkerSendMessage) => {

    while (!Data.Ready) {

        // Defer the message until the subsystem is ready

        await new Promise((resolve) => setTimeout(resolve, 100));

    }

    const Action = Message.Request;

    if (Action in functions) {

        await functions[Action](Message).catch((error) => { 

            Log("Error", "Subsystem Error", `General error in an action's runtime: ${error}`);

        });

    } else {

        Log("Warning", "Subsystem Message Mismatch", `Received unknown message from parent: ${Action}`);

    }

});

interface Functions {

    [key: string]: (message: WorkerSendMessage) => Promise<void>;

}

const functions: Functions = {

    [WorkerRequest.Connect]: async (message: WorkerSendMessage) => {

        const VoiceChannel: string = message.Data.VoiceChannelID;

        const ResolvedVC = Data.Client.getChannel(VoiceChannel);

        if (ResolvedVC.type !== Constants.ChannelTypes.GUILD_VOICE && ResolvedVC.type !== Constants.ChannelTypes.GUILD_STAGE_VOICE) { 

            Log("Warning", "Subsystem Error", `Invalid channel type passed: ${ResolvedVC.type}`);

            ReturnError(message.RequestID, {

                Code: ErrorCode.InvalidArgument,
                Message: "Invalid channel ID",

            });

            process.exit(1);

        }

        Data.VoiceConnection = await ResolvedVC.join({ 

            opusOnly: true,

        }).catch((error) => {

            Log("Error", "Connection Error", `Error joining voice channel: ${error}`);

            ReturnError(message.RequestID, {

                Code: ErrorCode.UnknownError,
                Message: `Error joining voice channel: ${error}`

            });

            process.exit(1);

        });
        
        HookEvents(Data.VoiceConnection);

        await WaitForVoiceConnectionReady().catch((error) => {

            Log("Error", "Connection Error", "Error waiting for voice connection to be ready.");

            ReturnError(message.RequestID, {

                Code: ErrorCode.TimeoutError,
                Message: `Error waiting for voice connection to be ready: ${error}`

            });

            process.exit(1);

        });

        ReturnToParent(message.RequestID, null);

    },

    [WorkerRequest.Disconnect]: async (message: WorkerSendMessage) => {

        if (Data.VoiceConnection === null) {

            Log("Warning", "Subsystem Error", "Tried to disconnect from a non-existent voice connection.");

            ReturnError(message.RequestID, {

                Code: ErrorCode.InvalidArgument,
                Message: "Tried to disconnect from a non-existent voice connection."

            });

            process.exit(1);

        }

        Data.VoiceConnection.disconnect();

        ReturnToParent(message.RequestID, null);

    },
    
};

function HookEvents(connection: VoiceConnection): void { 

    connection.on("error", (error) => {

        Log("Error", "Connection Error", `Voice connection error: ${error}`);
        EmitEvent(WorkerEvents.Error, error);

    });

    connection.on("disconnect", () => {

        EmitEvent(LogicalQueueEvents.ConnectionDestroyed);
        connection.removeAllListeners();

    });

    connection.on("ready", () => {

        EmitEvent(LogicalQueueEvents.ConnectionCreated);

    });
        
}