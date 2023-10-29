export interface DiscordConfig { 

    // DiscordConfig is only used within a greater config struct, so it is not exported.

    ClientID: string;
    ClientSecret: string;

    Token: string;

}

export interface MainConfig {

    // Path: configs/json/main.json

    Mode: "Dev" | "Prod";

    Version: { 

        Backend: string;
        Frontend: string;

    },

    QueueBehavior: { 

        VoiceCommands: boolean;
        Volume: boolean;
        Lock: boolean;

    },

    Status: { 

        Text: string;
        Type: number;

    }

}

export interface WebConfig { 

    // Path: configs/json/web.json

    Port: number;
    Host: string;

    GlobalRateLimit: { 

        Enabled: boolean;
        MaxRequests: number;

    }

}

export interface DatabaseConfig {

    // Path: configs/json/database.json
    
    Host: string;

}

export interface KeysConfig { 

    // Path: configs/json/keys.json

    Discord: {

        Prod: DiscordConfig;
        Dev: DiscordConfig;

        Webhooks: { 

            Logging: string

        }

    }

}

export interface UIConfig { 

    // Path: configs/json/ui.json

    Embeds: { 

        Color: string;
        Footer: { 

            Text: string;
            Icon: string;

        }

    }

}

export interface UserConfig { 

    // Path: configs/json/users.json

    Blacklisted: string[];
    Developers: string[];

}

export interface LinksConfig {

    // Path: configs/json/links.json
    
    Sprout: string,

    Synthara: string,
    SyntharaUltra: string

}