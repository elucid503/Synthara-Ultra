import { ActionRow } from "@projectdysnomia/dysnomia";

enum ButtonStyle {

    Primary = 1,
    Secondary = 2,
    Success = 3,
    Danger = 4,
    Link = 5

}
  
interface IButtonOptions {

    label: string;
    customId?: string;
    url?: string;
    style: ButtonStyle;
    disabled?: boolean;

}
  
export class DiscordButton {

    type: number = 2;
    label: string;
    customId?: string;
    url?: string;
    style: ButtonStyle;
    disabled?: boolean;
  
    constructor(options: IButtonOptions) {

        this.label = options.label;
        this.customId = options.customId;
        this.url = options.url;
        this.style = options.style;
        this.disabled = options.disabled;
    
    }
  
    static createButton(options: IButtonOptions): DiscordButton {

        return new DiscordButton(options);
        
    }

}

/**
 * This function creates a new button from the given options.
 * 
 * @param options - General button options like Label, CustomID, etc...
 * 
 * @returns A DiscordButton object that can be sent to the Discord API within a ButtonActionRow at any time.
*/

export function CreateButton(options: { Label: string, CustomID?: string, URL?: string, Style: ButtonStyle, Disabled?: boolean }): DiscordButton {
    
    if (options.Style === ButtonStyle.Link && !options.URL) {

        throw new Error("URL must be provided for Link buttons.");
        
    }

    if (options.Style !== ButtonStyle.Link && !options.CustomID) {

        throw new Error("CustomID must be provided for non-Link buttons.");
        
    }
    
    return DiscordButton.createButton({

        label: options.Label,
        customId: options.CustomID,
        url: options.URL,
        style: options.Style,
        disabled: options.Disabled
      
    });

}

export class ButtonActionRow {

    type: number = 1;
    components: DiscordButton[];
  
    constructor(components: DiscordButton[]) {

        this.components = components;
        
    }

}

/**
 * This function creates a new Button-Based ActionRow from the given buttons.
 * 
 * @param buttons - An array of DiscordButtons that will be put in the ActionRow
 * 
 * @returns A specialized button action row in the form of a ButtonActionRow instance.
*/

export function CreateButtonActionRow(buttons: DiscordButton[]): ActionRow {

    return new ButtonActionRow(buttons) as ActionRow;

}

export interface ProceduralButtonOptions {

    Prefix: string;
    Suffix?: string;

    OverrideCustomID?: string;

}

export function GetPageButtons(StdOptions: ProceduralButtonOptions, start: number, current: number, end: number): ActionRow {

    const Disabled = {

        Forward: false,
        Backward: false

    };

    if (current === start) { Disabled.Backward = true; }
    if (current === end) { Disabled.Forward = true; }

    return CreateButtonActionRow([

        CreateButton({ Disabled: Disabled.Backward, Label: "< Previous", CustomID: `${StdOptions.Prefix}-${StdOptions.OverrideCustomID ? StdOptions.OverrideCustomID : "previous"}:${start},${current},${end}`, Style: ButtonStyle.Secondary }),
        CreateButton({ Disabled: Disabled.Forward, Label: "Next >", CustomID: `${StdOptions.Prefix}-${StdOptions.OverrideCustomID ? StdOptions.OverrideCustomID : "next"}:${start},${current},${end}`, Style: ButtonStyle.Secondary }),

    ]);
    
}

export function GetYesNoButtons(StdOptions: ProceduralButtonOptions): ActionRow { 

    return CreateButtonActionRow([

        CreateButton({ Label: "Yes", CustomID: `${StdOptions.Prefix}-${StdOptions.OverrideCustomID ? StdOptions.OverrideCustomID : "yes"}`, Style: ButtonStyle.Success }),
        CreateButton({ Label: "No", CustomID: `${StdOptions.Prefix}-${StdOptions.OverrideCustomID ? StdOptions.OverrideCustomID : "no"}`, Style: ButtonStyle.Danger }),

    ]);

}