import {
    MainConfig,
    WebConfig,
    DatabaseConfig,
    KeysConfig,
    UIConfig,
    UserConfig,
    LinksConfig
} from "./structs";

import { file as BunFile } from "bun";

export type ConfigFile = "main" | "web" | "database" | "keys" | "ui" | "users";

interface ConfigMap {

    "main": MainConfig,
    "web": WebConfig,
    "database": DatabaseConfig,
    "keys": KeysConfig,
    "ui": UIConfig,
    "links": LinksConfig,
    "users": UserConfig

}

/**
 * This function loads a configuration file and returns the correct configuration in terms of the structs.
 * 
 * @param config - The name of the configuration file to load, must match the ConfigFile type.
 * 
 * @returns A promise that resolves to the configuration mapped in ConfigMap.
*/

export async function LoadConfig<T extends ConfigFile>(config: T): Promise<ConfigMap[T] | null> { 

    const file = BunFile(`./configs/json/${config}.json`);

    const data = await file.json().catch((error) => { 

        // We can't use a webhook in this case as this is used before the webhook functions are initialized

        console.error(error);

        return null;
        
    });

    if (!data) return null;

    return data as ConfigMap[T];

}