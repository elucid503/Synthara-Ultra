import { AnyVoiceChannel, TextableChannel } from "@projectdysnomia/dysnomia";
import { TypedEmitter } from "tiny-typed-emitter";

import { Track } from "./track";
import { Subsystem } from "./subsystem";
import { WorkerRequest } from "../handlers/subsystem";

// Enums and Structs

interface QueueEvents {

    // Connection Events

    "ConnectionCreated": () => void;
    "ConnectionDestroyed": () => void;
    
    // Track Events
    
    "TrackAdded": (track: Track, position: number) => void;
    "TrackRemoved": (track: Track, position: number) => void;
    "TrackMoved": (track: Track, oldPosition: number, newPosition: number) => void;
    "TracksCleared": () => void;
    "TracksShuffled": () => void;
    "TrackPlaying": (track: Track) => void;
    
    // Queue Events
    
    "ShuffleModeChanged": (mode: QueueShuffleMode) => void;
    "RepeatModeChanged": (mode: QueueRepeatMode) => void;
    "AutoPlayChanged": (value: boolean) => void;
    "VolumeChanged": (level: number) => void;
    
    // General Events
    
    "StatusChanged": (status: QueueStatus) => void;
    "ChannelChanged": (textChannel: TextableChannel | null, voiceChannel: AnyVoiceChannel | null) => void;
    "SettingsChanged": (settings: QueueSettings) => void;

}

export enum LogicalQueueEvents {

    // Connection Events

    "ConnectionCreated" = "ConnectionCreated",
    "ConnectionDestroyed" = "ConnectionDestroyed",
    
    // Track Events
    
    "TrackAdded" = "TrackAdded",
    "TrackRemoved" = "TrackRemoved",
    "TrackMoved" = "TrackMoved",
    "TracksCleared" = "TracksCleared",
    "TracksShuffled" = "TracksShuffled",
    "TrackPlaying" = "TrackPlaying",
    
    // Queue Events
    
    "ShuffleModeChanged" = "ShuffleModeChanged",
    "RepeatModeChanged" = "RepeatModeChanged",
    "AutoPlayChanged" = "AutoPlayChanged",
    "VolumeChanged" = "VolumeChanged",
    
    // General Events
    
    "StatusChanged" = "StatusChanged",
    "ChannelChanged" = "ChannelChanged",
    "SettingsChanged" = "SettingsChanged",

}

export enum QueueStatus { 

    Playing = "Playing",
    Paused = "Paused",
    Standby = "Standby",
    Disconnected = "Disconnected",

    Panic = "Panic"

}

export enum QueueRepeatMode {

    Off = "Off",
    Track = "Track",
    Queue = "Queue",

}

export enum QueueShuffleMode {

    Off = "Off",
    On = "On",

}

interface QueueSettings {

    RepeatMode: QueueRepeatMode;
    ShuffleMode: QueueShuffleMode;

    Volume: { 

        Adaptive: boolean,
        Level: number

    }

    AutoPlay: boolean;

}   

interface QueueInternals { 

    Subsystem: Subsystem;

    PlaybackDurations: { 

        Full: number,
        Current: number

    }

}

class TrackManager {

    readonly Queue: Queue;

    protected Current: Track | null;

    protected Tracks: {

        Upcoming: Track[];
        Previous: Track[];

    };

    protected Suggestions: Track[];

    constructor(queue: Queue) { 
        
        this.Queue = queue;

        this.Current = null;

        this.Tracks = {

            Upcoming: [],
            Previous: []

        };

        this.Suggestions = [];

    }

    // Getters and Setters

    public get Upcoming(): Track[] { return this.Tracks.Upcoming; }

    public get Previous(): Track[] { return this.Tracks.Previous; }

    // Methods

    /**
     * Rotates the internal TrackManager's queue to the next song.
     * This is private and should always be used in place of modifying the queue manually.
     *      
     * @param Direction - Whether to rotate forward or backward
    */

    private Rotate(Direction: "Forward" | "Backward"): void { 

        if (!this.Current && Direction === "Forward") return;

        if (Direction === "Forward") { 

            this.Tracks.Previous.push(this.Current!);

            this.Current = this.Tracks.Upcoming.shift() || null;

        }

        else { 

            if (this.Tracks.Previous.length === 0) { 

                return;

            }

            this.Tracks.Upcoming.unshift(this.Current!);

            this.Current = this.Tracks.Previous.pop() || null;

        }

    }

    /**
     * Skips to the next song and plays it.
     * 
     * Clears the queue if there are no more songs to play.
    */

    public async Skip(): Promise<void> { 

        this.Rotate("Forward");

        // Do track logic here 
        
    }

    /**
     * Skips to the last song and plays it.
     * 
     * Replays the current song if there are no previous songs.
    */

    public async Back(): Promise<void> {

        this.Rotate("Backward");

        // Do track logic here

    }

    /**
     * Adds a song to the upcoming or current queue.
     * 
     * @returns A number that indicates the position of the new track.
    */

    public Add(Track: Track): number {

        if (!this.Current) { 

            this.Current = Track;

            this.Queue.Events.emit("TrackAdded", Track, 0);

            return 0;

        }   

        else { 

            const Pos: number = this.Tracks.Upcoming.length;

            this.Tracks.Upcoming.push(Track);

            this.Queue.Events.emit("TrackAdded", Track, Pos);

            return Pos;

        }

    }

    /**
     * Attempts to find a track in the upcoming queue and remove it.
     * 
     * @returns A boolean indicating if the requested track was removed or not.
    */

    public Remove(Track: Track): boolean {

        const Index: number = this.Tracks.Upcoming.indexOf(Track);

        if (Index === -1) return false;

        this.Tracks.Upcoming.splice(Index, 1);

        this.Queue.Events.emit("TrackRemoved", Track, Index);

        return true;

    }

    /**
     * Attempts to move a track in the upcoming queue.
     * 
     * @returns A boolean indicating if the move was actually made.
    */

    public Move(Track: Track, Position: number): boolean {

        const Index: number = this.Tracks.Upcoming.indexOf(Track);

        if (Index === -1) return false;

        this.Tracks.Upcoming.splice(Index, 1);

        this.Tracks.Upcoming.splice(Position, 0, Track);

        this.Queue.Events.emit("TrackMoved", Track, Index, Position);

        return true;

    }

     /**
     * Calculates the time between the current track and a given track at the inputted index.
     * 
     * @param Index - The index of the track to calculate the time to
     * 
     * @returns A number indicating the amount of seconds until the requested track.
    */
    
    public GetRemainingTimeUntil(Index: number = 0): number {

        const CurrentPlaybackTime: number = this.Queue.Internals.PlaybackDurations.Current;
        let TimeUntil: number = this.Queue.Internals.PlaybackDurations.Full - CurrentPlaybackTime;

        for (let i = 0; i < Index; i++) { 

            TimeUntil += this.Tracks.Upcoming[i]?.Metadata.Duration.Seconds || 0;

        }

        return TimeUntil;

    }

    /**
     * Clears the current, upcoming and previous tracks.
    */

    public Clear(): void {

        this.Current = null;

        this.Tracks.Upcoming = [];

        this.Tracks.Previous = [];

        this.Queue.Events.emit("TracksCleared");

    }

    /**
     * Shuffles the upcoming songs in the queue.
    */

    public Shuffle(): void {

        this.Tracks.Upcoming = this.Tracks.Upcoming.sort(() => Math.random() - 0.5);

        this.Queue.Events.emit("TracksShuffled");

    }

    /**
     * Searches for relevant suggested songs, and then overwrites the TrackManager.Suggestions array with them.
     * 
     * @returns A boolean indicating if new suggestions were added or not.
    */

    public async UpdateSuggestions(): Promise<boolean> { 

        return true; // To implement soon!

    }
    
}

// Main Class

export class Queue {

    readonly GuildID: string;

    readonly TrackManager: TrackManager;

    protected Status: QueueStatus;

    readonly Events: TypedEmitter<QueueEvents>;
    
    protected Channels: {
        
        TextChannel: TextableChannel | null,
        VoiceChannel: AnyVoiceChannel | null

    };

    protected Settings: QueueSettings;

    public Internals: QueueInternals;

    constructor(guild: string) {

        this.GuildID = guild;

        this.TrackManager = new TrackManager(this);

        this.Status = QueueStatus.Standby;

        this.Events = new TypedEmitter();

        this.Channels = {

            TextChannel: null,
            VoiceChannel: null

        };

        this.Settings = {

            RepeatMode: QueueRepeatMode.Off,
            ShuffleMode: QueueShuffleMode.Off,

            Volume: {

                Adaptive: true,
                Level: 100

            },

            AutoPlay: true

        };

        this.Internals = {

            Subsystem: new Subsystem(this.GuildID),

            PlaybackDurations: {

                Full: 0,
                Current: 0

            }

        };

    }

    // Getters and Setters

    private get TextChannel(): TextableChannel | null { return this.Channels.TextChannel; }

    private set TextChannel(channel: TextableChannel | null) {
        
        this.Channels.TextChannel = channel;
        this.Events.emit("ChannelChanged", channel, this.Channels.VoiceChannel);

    }

    private get VoiceChannel(): AnyVoiceChannel | null { return this.Channels.VoiceChannel; }

    private set VoiceChannel(channel: AnyVoiceChannel | null) {
        
        this.Channels.VoiceChannel = channel;
        this.Events.emit("ChannelChanged", this.Channels.TextChannel, channel);

    }

    public get RepeatMode(): QueueRepeatMode { return this.Settings.RepeatMode; }

    public set RepeatMode(mode: QueueRepeatMode) {
        
        this.Settings.RepeatMode = mode;
        this.Events.emit("RepeatModeChanged", mode);

    }

    public get ShuffleMode(): QueueShuffleMode { return this.Settings.ShuffleMode; }

    public set ShuffleMode(mode: QueueShuffleMode) {
        
        this.Settings.ShuffleMode = mode;
        this.Events.emit("ShuffleModeChanged", mode);

    }

    public get Volume(): number { return this.Settings.Volume.Level; }

    public set Volume(level: number) {
        
        this.Settings.Volume.Level = level;
        this.Events.emit("VolumeChanged", level);

    }

    public get AutoPlay(): boolean { return this.Settings.AutoPlay; }

    public set AutoPlay(value: boolean) {
        
        this.Settings.AutoPlay = value;
        this.Events.emit("AutoPlayChanged", value);

    }

    public set State(status: QueueStatus) {

        this.Status = status;
        this.Events.emit("StatusChanged", status);

    }

    /**
     * Pauses the current stream being played.
    */

    public Pause(): void {

        this.State = QueueStatus.Paused;

    }

    /**
     * Pauses the current stream being played.
    */

    public Resume(): void {

        this.State = QueueStatus.Playing;

    }

    /**
     * Connects to a voice channel and sets the linked text channel.
     * 
     * @param TextChannel - The text channel to link to the queue
     * @param VoiceChannel - The voice channel to connect to
     * 
     * @returns A boolean indicating if the connection was successful or not.
    */
    
    public async Connect(TextChannel: TextableChannel, VoiceChannel: AnyVoiceChannel): Promise<boolean> {

        if (this.State === QueueStatus.Panic) return false;

        this.TextChannel = TextChannel;

        this.VoiceChannel = VoiceChannel;

        this.Internals.Subsystem.HookEvents(this.Events);

        const response = await this.Internals.Subsystem.ExecuteActionOnWorker({

            Request: WorkerRequest.Connect,

            Data: {

                VoiceChannelID: this.VoiceChannel.id,

            }
            
        });

        if (response.Error) { 

            this.State = QueueStatus.Panic;

            return false;

        }
        
        this.State = QueueStatus.Standby;

        return true;

    }

}