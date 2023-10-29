// Embed Types Enum (Optional)

import { LoadConfig } from "../../configs/ts/reader";

const config = await LoadConfig("ui");

enum EmbedType {

    Rich = "rich",
    Image = "image",
    Video = "video",
    Gifv = "gifv",
    Article = "article",
    Link = "link",

}
  
interface EmbedThumbnail {

    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;

}
  
interface EmbedVideo {
      
    url?: string;
    proxy_url?: string;
    height?: number;
    width?: number;

}
  
interface EmbedImage {
      
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;

}
  
  interface EmbedProvider {
    name?: string;
    url?: string;
  }
  
interface EmbedAuthor {
      
    name: string;
    url?: string;
    icon_url?: string;
    proxy_icon_url?: string;

}

interface EmbedFooter {
      
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;

}
  
interface EmbedField {
      
    name: string;
    value: string;
    inline?: boolean;

}
  
export interface DiscordEmbed {

    title?: string;
    type?: EmbedType; 
    description?: string;
    url?: string;
    timestamp?: string;
    color?: number;
    footer?: EmbedFooter;
    image?: EmbedImage;
    thumbnail?: EmbedThumbnail;
    video?: EmbedVideo;
    provider?: EmbedProvider;
    author?: EmbedAuthor;
    fields?: EmbedField[];

}
  
// Additional structs for Attachment and Allowed Mentions

export interface Attachment {

    id: string;
    filename: string;
    description?: string;
    content_type?: string;
    size: number;
    url: string;
    proxy_url: string;
    height?: number | null;
    width?: number | null;
    ephemeral?: boolean;
    duration_secs?: number;
    waveform?: string;
    flags?: number;

}
  
export interface AllowedMentions {

    parse: ("roles" | "users" | "everyone")[];
    roles: string[];
    users: string[];
    replied_user: boolean;

}

interface CreateEmbedOptions {

    title?: string;
    url?: string;
    color?: string;

    description?: string;   

    author?: EmbedAuthor;
    footer?: EmbedFooter;
    timestamp?: string;

    fields?: EmbedField[];

    image?: EmbedImage;
    thumbnail?: EmbedThumbnail;

}

export enum CommonColors { 

    Default = "#aee4f2",
    Success = "#7af996",
    Warning = "#fcde49",
    Error = "#fc4967"

}

/**
 * This function creates a new embed from the given options.
 * 
 * @param options - General embed options like Title, Color, etc...
 * 
 * @returns A DiscordEmbed object that can be sent to the Discord API at any time.
*/

export function CreateEmbed(options: CreateEmbedOptions): DiscordEmbed {

    // This function provides a simple way to create an embed without having to create / use the class.

    const Embed: DiscordEmbed = {};

    Embed.color = options.color ? parseInt(options.color.replace("#", ""), 16) : parseInt(CommonColors.Default.replace("#", ""), 16);

    if (options.title) Embed.title = options.title;
    if (options.url) Embed.url = options.url;

    if (options.description) Embed.description = options.description;

    if (options.author) Embed.author = options.author;

    if (options.footer) {
    
        Embed.footer = options.footer;

    }

    else { 

        Embed.footer = { text: config!.Embeds.Footer.Text, icon_url: config!.Embeds.Footer.Icon };

    }

    if (options.timestamp) Embed.timestamp = options.timestamp;

    if (options.fields) Embed.fields = options.fields;

    if (options.image) Embed.image = options.image;
    if (options.thumbnail) Embed.thumbnail = options.thumbnail;

    return Embed;

}