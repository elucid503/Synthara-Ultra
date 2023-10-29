// Enums and Structs

export enum TrackType { 

    Normal = "normal",
    Arbitrary = "arbitrary",
    
}

export enum Platforms { 

    Default = "default",
    Spotify = "spotify",
    YouTube = "youtube",
    SoundCloud = "soundcloud",
    AppleMusic = "applemusic",
    Deezer = "deezer",
    Tidal = "tidal",
    AmazonMusic = "amazonmusic",
    External = "external"

}

export interface PartialPlaylistDetails {

    ID: string,
    Name: string,
    Artist: string,

    TrackLength: number,

}

export interface TrackResolvable { 

    Title: string,
    ID: string,
    
    Artists: { 

        Names: string[],
        IDs: string[]

    },

    Album: { 

        Name: string,
        ID: string | null

    },

    Duration: { 

        Seconds: number,
        Milliseconds: number

    },

    Cover: string,

    Meta: { 

        Explicit: boolean,

        Source: Platforms

    }

}

export interface TrackInternals {

    PlaylistMeta: { 

        // -1 = Not in a playlist
        
        Index: number,

        PlaylistDetails: PartialPlaylistDetails | null;

    },

    Lyrics: { 

        Exists: boolean,

        InternalData: { 

            APIUrl: string,
            // Cached: unknown

        }

    }

}

// Main Class 

export class Track { 

    readonly Type: TrackType;

    protected Parent: string | null;

    readonly Metadata: TrackResolvable;

    protected Internals: TrackInternals;

    constructor(Resolvable: TrackResolvable, Type: TrackType = TrackType.Normal) { 

        this.Type = Type;
        this.Parent = null;

        this.Metadata = Resolvable;

        this.Internals = {

            PlaylistMeta: { 

                Index: -1,
                PlaylistDetails: null

            },

            Lyrics: { 

                Exists: false,
                InternalData: { 

                    APIUrl: "",
                    // Cached: null

                }

            }

        };

    }

    public get Serialize(): TrackResolvable {

        return this.Metadata;

    }

    public get SyntheticSearch() { 

        return `${this.Metadata.Title} ${this.Metadata.Artists.Names.join(", ")}`;

    }

    public set TrackedParent(parent: string) { 

        this.Parent = parent;
        
    }

}

