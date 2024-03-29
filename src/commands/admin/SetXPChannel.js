const Command = require("../Command.js");
const { MessageEmbed } = require("discord.js");
const { success } = require("../../utils/emojis.json");
const { oneLine } = require("common-tags");

module.exports = class SetXPChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: "setxpchannel",
      aliases: ["setxpc", "sxpc"],
      usage: "setxpchannel <channel mention/ID>",
      description: oneLine`
        Sets the xp text channel for your server. 
        All level up messages will be sent there.
      `,
      type: client.types.ADMIN,
      clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ADD_REACTIONS"],
      userPermissions: ["MANAGE_GUILD"],
      examples: ["setxpchannel #levels"],
    });
  }
  async run(message, args) {
    let { xpChannelID: xpChannelID, xpMessageAction: xp_message_action } =
      await message.client.mongodb.settings.selectRow(message.guild.id);
    const oldXPChannel =
      message.guild.channels.cache.get(xpChannelID) || "`None`";

    // Update status

    // Get status
    const oldStatus = message.client.utils.getStatus(xp_message_action);

    const xpChannel =
      this.getChannelFromMention(message, args[0]) ||
      message.guild.channels.cache.get(args[0]);

    // Update status
    const status = message.client.utils.getStatus(xpChannel);
    const statusUpdate =
      oldStatus !== status
        ? `\`${oldStatus}\` ➔ \`${status}\``
        : `\`${oldStatus}\``;

    const embed = new MessageEmbed()
      .setTitle("Settings: `XP`")
      .setDescription(`The \`xp channel\` was successfully updated. ${success}`)
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: message.member.displayName,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    if (!xpChannel || xpChannel.type !== "GUILD_TEXT" || !xpChannel.viewable) {
      await message.client.mongodb.settings.updateXPChannelId(null, message.guild.id);

      return message.channel.send({
        embeds: [
          embed
            .spliceFields(1, 0, {
              name: "Channel",
              value: `${oldXPChannel} ➔ \`None\``,
              inline: true,
            })
            .spliceFields(2, 0, {
              name: "Status",
              value: statusUpdate,
              inline: true,
            }),
        ],
      });
    }

    // Clear if no args provided
    if (args.length === 0) {
      await message.client.mongodb.settings.updateXPChannelId(null, message.guild.id);

      // Update status

      return message.channel.send({
        embeds: [
          embed
            .spliceFields(1, 0, {
              name: "Channel",
              value: `${oldXPChannel} ➔ \`None\``,
              inline: true,
            })
            .spliceFields(2, 0, {
              name: "Status",
              value: statusUpdate,
              inline: true,
            }),
        ],
      });
    }

    await message.client.mongodb.settings.updateXPChannelId(
      xpChannel.id,
      message.guild.id
    );
    message.channel.send({
      embeds: [
        embed
          .spliceFields(1, 0, {
            name: "Channel",
            value: `${oldXPChannel} ➔ ${xpChannel}`,
            inline: true,
          })
          .spliceFields(2, 0, {
            name: "Status",
            value: `\`${oldStatus}\``,
            inline: true,
          }),
      ],
    });
  }
};
