interface DiscordWebhookPayload {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    footer?: {
      text: string;
    };
    timestamp?: string;
  }>;
}

export async function sendDiscordWebhook(webhookUrl: string, payload: DiscordWebhookPayload): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending Discord webhook:', error);
    return false;
  }
}

export function createPledgeNotificationEmbed(
  serverName: string,
  pledgerName: string,
  pledgeAmount: number,
  serverCost: number,
  totalPledged: number,
  pledgerCount: number
) {
  const progressPercentage = Math.min((totalPledged / serverCost) * 100, 100);
  const remainingCost = Math.max(0, serverCost - totalPledged);
  
  return {
    title: `🎉 New Pledge to ${serverName}`,
    description: `**${pledgerName}** has pledged **$${pledgeAmount.toFixed(2)}** to your server!`,
    color: 0x00ff00, // Green color
    fields: [
      {
        name: '💰 Pledge Amount',
        value: `$${pledgeAmount.toFixed(2)}`,
        inline: true,
      },
      {
        name: '📊 Total Pledged',
        value: `$${totalPledged.toFixed(2)} / $${serverCost.toFixed(2)}`,
        inline: true,
      },
      {
        name: '👥 Pledgers',
        value: `${pledgerCount} people`,
        inline: true,
      },
      {
        name: '📈 Progress',
        value: `${progressPercentage.toFixed(1)}% funded`,
        inline: true,
      },
      {
        name: '💸 Remaining',
        value: `$${remainingCost.toFixed(2)}`,
        inline: true,
      },
      {
        name: '🎯 Status',
        value: remainingCost > 0 ? 'Still accepting pledges' : 'Goal reached!',
        inline: true,
      },
    ],
    footer: {
      text: 'communitypledges.com • Real-time notifications',
    },
    timestamp: new Date().toISOString(),
  };
}

export function createBoostNotificationEmbed(
  serverName: string,
  boosterName: string,
  boostAmount: number,
  boostExpiresAt: Date
) {
  const expiresIn = Math.ceil((boostExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60)); // Hours
  
  return {
    title: `⚡ Server Boosted: ${serverName}`,
    description: `**${boosterName}** has boosted your server for **$${boostAmount.toFixed(2)}**!`,
    color: 0xff6b35, // Orange color
    fields: [
      {
        name: '💎 Boost Amount',
        value: `$${boostAmount.toFixed(2)}`,
        inline: true,
      },
      {
        name: '⏰ Duration',
        value: '24 hours',
        inline: true,
      },
      {
        name: '🕐 Expires In',
        value: `${expiresIn} hours`,
        inline: true,
      },
    ],
    footer: {
      text: 'communitypledges.com • Server boost active',
    },
    timestamp: new Date().toISOString(),
  };
}

export function createUnpledgeNotificationEmbed(
  serverName: string,
  unpledgerName: string,
  unpledgeAmount: number,
  serverCost: number,
  totalPledged: number,
  pledgerCount: number
) {
  const progressPercentage = Math.min((totalPledged / serverCost) * 100, 100);
  const remainingCost = Math.max(0, serverCost - totalPledged);
  
  return {
    title: `👋 Pledge Removed: ${serverName}`,
    description: `**${unpledgerName}** has removed their pledge of **$${unpledgeAmount.toFixed(2)}** from your server.`,
    color: 0xff4444, // Red color
    fields: [
      {
        name: '💰 Removed Amount',
        value: `$${unpledgeAmount.toFixed(2)}`,
        inline: true,
      },
      {
        name: '📊 Total Pledged',
        value: `$${totalPledged.toFixed(2)} / $${serverCost.toFixed(2)}`,
        inline: true,
      },
      {
        name: '👥 Pledgers',
        value: `${pledgerCount} people`,
        inline: true,
      },
      {
        name: '📈 Progress',
        value: `${progressPercentage.toFixed(1)}% funded`,
        inline: true,
      },
      {
        name: '💸 Remaining',
        value: `$${remainingCost.toFixed(2)}`,
        inline: true,
      },
      {
        name: '🎯 Status',
        value: remainingCost > 0 ? 'Still accepting pledges' : 'Goal reached!',
        inline: true,
      },
    ],
    footer: {
      text: 'communitypledges.com • Real-time notifications',
    },
    timestamp: new Date().toISOString(),
  };
}
