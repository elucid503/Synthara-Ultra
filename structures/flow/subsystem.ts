import { Worker } from "worker_threads";

import { WorkerResponseMessage, WorkerSendMessage } from "../handlers/subsystem";
import { GenerateRandomID } from "../../functions/utils/misc";

import { LogicalQueueEvents } from "./queue";

import { ErrorCode } from "../utils/errors";
import { TypedEmitter } from "tiny-typed-emitter";

const WorkerPaths = {

    Subsystem: `${process.cwd()}/workers/queue.ts`

};

export class Subsystem { 

    private Worker: Worker;

    constructor(guildID: string) { 

        this.Worker = new Worker(WorkerPaths.Subsystem, {workerData: { GuildID: guildID }});

    }

    public async ExecuteActionOnWorker(send: WorkerSendMessage): Promise<WorkerResponseMessage> { 

        this.Worker.postMessage(send);

        return new Promise((resolve) => {

            const Timeout = setTimeout(() => {

                this.Worker.off("message", MessageHandler);

                resolve({ 
                    
                    RequestID: send.RequestID || GenerateRandomID(),
                    Error: { 

                        Code: ErrorCode.TimeoutError,
                        Message: "The request timed out."

                    }, 

                    Data: null

                } satisfies WorkerResponseMessage);

            }, 60_000);

            const MessageHandler = (message: WorkerResponseMessage) => {

                if (message.RequestID !== send.RequestID) { return; }

                this.Worker.off("message", MessageHandler);
                clearTimeout(Timeout);

                resolve(message);

            };

            this.Worker.on("message", MessageHandler);

        });

    }

    public HookEvents(QueueEventEmitter: TypedEmitter): void { 

        this.Worker.on("message", (message: WorkerResponseMessage) => {

            // Not an event

            if (message.RequestID !== "0" || !message.Event) { return; }

            if (LogicalQueueEvents[message.Event as LogicalQueueEvents]) {

                QueueEventEmitter.emit(message.Event as LogicalQueueEvents, message.Data);
                
            }

        });

    }

}