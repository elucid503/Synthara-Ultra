import { Queue } from "../structures/flow/queue";

export function HookQueueEvents(queue: Queue): void { 

    queue.Events.on("ConnectionCreated", () => {

        console.log("Got created event");
        
    });

}