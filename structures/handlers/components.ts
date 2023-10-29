import { Db } from "mongodb";
import { ComponentInteraction } from "@projectdysnomia/dysnomia";

import { SyntharaUltra } from "../../";

export interface MessageComponentHandlerData { 

    Group: string;
    Args: number;

    Restrictions: {

        Developer: boolean;

    },

    RateLimit: number | null;

    Components: { 
    
        ID: string;
        Executable: (Ctx: ComponentInteraction, Client: SyntharaUltra, Args: Array<string[]>, DB: Db) => Promise<void>;
    
    }[]

}

/**
 * This function parses the ID of an incoming message component.
 * 
 * @param ID - The message component ID.
 * 
 * @returns An object containing the group, original ID and a 2-D array of arguments and their possible sub-args.
*/

export function ParseComponentID(ID: string): { Group: string, BaseID: string, Args: Array<string[]> } {

    const GroupPair = ID.split("-");

    const Group = GroupPair.shift() || "None";
    
    const Split = GroupPair[1]?.split(":") || ["None"];

    const BaseID = Split.shift() || "None";

    const ReturnArr = [];

    for (const Arg of Split) {

        if (Arg.includes(",")) {

            ReturnArr.push(Arg.split(","));

        } else {

            ReturnArr.push([Arg]);

        }

    }

    return { Group: Group, BaseID: BaseID, Args: ReturnArr };

}