import { LogicalQueueEvents } from "../flow/queue";
import { ErrorCode } from "../utils/errors";

export enum WorkerEvents { 
    
    // Startup-Sequence

    Started = "Started",

    // Player Events

    PlayerStart = "PlayerStart",
    PlayerStop = "PlayerStop",
    PlayerPause = "PlayerPause",
    PlayerResume = "PlayerResume",

    // General Events

    Error = "Error",

}

export enum WorkerRequest {

    // Connection Operations

    Connect = "Connect",
    Disconnect = "Disconnect",

}

interface WorkerArguments {

    [WorkerRequest.Connect]: {

        VoiceChannelID: string;
        
    };

    [WorkerRequest.Disconnect]: {

        VoiceChannelID: string;
        
    };

}
  
export interface WorkerSendMessage {
      
    RequestID?: string;
    Request: keyof typeof WorkerRequest;

    Data: WorkerArguments[WorkerRequest];

}

export interface WorkerResponseMessage { 

    RequestID: string;
    Event?: WorkerEvents | LogicalQueueEvents;

    Error: WorkerError | null;
    
    Data: any; //eslint-disable-line

}

export interface WorkerError { 

    Code: ErrorCode;
    Message: string;
    
}