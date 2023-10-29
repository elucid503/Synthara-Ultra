import { CommandInteraction, ComponentInteraction } from "@projectdysnomia/dysnomia";

import { CreateEmbed, DiscordEmbed } from "../../structures/apis/embeds";
import { GetPageButtons } from "../../structures/apis/components";

import { Notification, User } from "../../structures/database/user";

/**
 * This function pesters a user if they have unread notifications.
 * 
 * @param user - The user database instance.
 * @param interaction - Any interaction that can be followed up on.
 * 
 * @returns A promise that resolves to nothing, not really meant to be checked.
*/

export async function Notify(user: User, interaction: CommandInteraction | ComponentInteraction): Promise<void> { 

    if (user.Notifications.length === 0) { return; }

    if (!user.Settings.Notifications) { return; }

    let IsRepliable: boolean = false;

    const interval = setInterval(() => {

        if (interaction.acknowledged) {
            
            IsRepliable = true;
            OnReplied();

            clearInterval(interval);
        }

    }, 100);

    setTimeout(() => {

        if (!IsRepliable) { return clearInterval(interval); }
    
    }, 10_000);

    async function OnReplied() {
    
        const Embeds: DiscordEmbed[] = user.Notifications.map((notification: Notification) => {

            return CreateEmbed({

                title: notification.title,
                description: notification.message,
                timestamp: notification.timestamp.toString(),

                author: { name: `New ${notification.type}` },

            });

        });

        const Components = GetPageButtons({ Prefix: "Notifications" }, 0, 0, Embeds.length);

        await interaction.createFollowup({ embeds: [Embeds[0]], components: [Components] });
    
    }

}