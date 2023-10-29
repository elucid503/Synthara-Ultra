import { Db } from "mongodb";

import { Log } from "../../functions/utils/logging";

interface UserSettings { 

    VoiceCommands: boolean;
    Notifications: boolean;

}

export interface Notification { 

    title: string;
    message: string;
    type: "Alert" | "Outage" | "Update";

    timestamp: number;

}

export class User implements User { 

    readonly ID: string;
    readonly Settings: UserSettings;
    readonly Notifications: Notification[];

    constructor(ID: string, Existing?: any) { // eslint-disable-line @typescript-eslint/no-explicit-any

        this.ID = ID;
        this.Settings = Existing?.Settings ?? { 

            VoiceCommands: true,
            Notifications: true

        };

        this.Notifications = Existing?.Notifications || [];
            
    }

    /**
     * This function saves a user to the database.
     * 
     * @param DB - The database instance to provide and take action on.
     * 
     * @returns A promise that resolves to a boolean indicating if the database write was successful.
    */

    public async Save(DB: Db): Promise<boolean> {

        return DB.collection("Users").updateOne({ ID: this.ID }, { $set: { Settings: this.Settings } }).then(() => { return true; }).catch((error) => { 

            Log("Error", "Database Error.", `Failed to write user settings for ${this.ID}: ${error.message}`);
            return false;

        });

    }

    /**
     * This function adds a notification struct to a user's "inbox".
     * 
     * @param DB - The database instance to provide and take action on.
     * @param Notification - The notification struct to add to the user's "inbox".
     * 
     * @returns A promise that resolves to a boolean indicating if any required writes were successful.
    */

    public async AddNotification(DB: Db, Notification: Notification): Promise<boolean> {

        if (!this.Settings.Notifications) { return true; }

        this.Notifications.push(Notification);
        return await this.Save(DB);

    }

    /**
     * This function removes a notification struct to a user's "inbox".
     * 
     * @param DB - The database instance to provide and take action on.
     * @param Notification - The notification struct to remove from the user's "inbox".
     * 
     * @returns A promise that resolves to a boolean indicating if any required writes were successful.
    */

    public async RemoveNotification(DB: Db, Notification: Notification): Promise<boolean> {

        this.Notifications.splice(this.Notifications.indexOf(Notification), 1);
        return await this.Save(DB);

    }

}

export async function GetUser(db: Db, ID: string): Promise<User> { 

    return await db.collection("Users").findOne({ ID: ID }).then((result) => { 

        if (result) { 

            return new User(ID, result);

        } else { 

            return new User(ID);

        }

    }).catch((error) => { 

        Log("Error", "Database Error.", `Failed to get existing user ${ID}: ${error.message}`);
        return new User(ID);

    });

}