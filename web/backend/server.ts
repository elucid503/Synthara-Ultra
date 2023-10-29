import { Elysia } from "elysia";

import { cors } from "@elysiajs/cors";
import { autoroutes } from "elysia-autoroutes";
import { staticPlugin } from "@elysiajs/static";

import { LoadConfig } from "../../configs/ts/reader";
import { Log } from "../../functions/utils/logging";

const server = new Elysia();

/**
 * This function starts up the HTTP server for the API.
 * Will emit an error, which will be handled in index.ts if the config file is not found.
 * 
 * @returns A promise resolving to nothing.
*/

export async function StartAPI(): Promise<void> { 

    const config = await LoadConfig("web");

    if (!config) { throw new Error("Web Server Error: No config file found!"); }

    server.use(autoroutes({
        routesDir: "./web/backend/routes/api",
        prefix: "/api"
    }));

    server.use(staticPlugin({
        assets: "./web/frontend/assets",
        prefix: "assets"
    }));

    server.use(cors());

    Log("Info", "Web Server", `API started on port ${config.Port}`);

    server.listen(config.Port);

}

export type ElysiaApp = typeof server;