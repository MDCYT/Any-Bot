const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class SetMessageEditLogCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setmessageeditlog',
      aliases: ['setmsgeditlog', 'setmel', 'smel'],
      usage: 'setmessageeditlog <channel mention/ID>',
      description: oneLine`
        Sets the message edit log text channel for your server. 
        Provide no channel to clear the current \`message edit log\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setmessageeditlog #bot-log']
    });
  }
  async run(message, args) {
    const messageEditLogId = await message.client.mongodb.settings.selectMessageEditLogId(message.guild.id);
    const oldMessageEditLog = message.guild.channels.cache.get(messageEditLogId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Logging`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`message edit log\` was successfully updated. ${success}`)
      .setFooter({text: message.member.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true })})
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      await message.client.mongodb.settings.updateMessageEditLogId(null, message.guild.id);
      return message.channel.send({embeds: [embed.addField('Message Edit Log', `${oldMessageEditLog} ➔ \`None\``)]});
    }

    const messageEditLog = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
    if (!messageEditLog || messageEditLog.type !== 'GUILD_TEXT' || !messageEditLog.viewable)
      return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text channel or provide a valid text channel ID
      `);
    await message.client.mongodb.settings.updateMessageEditLogId(messageEditLog.id, message.guild.id);
    message.channel.send({embeds:[embed.addField('Message Edit Log', `${oldMessageEditLog} ➔ ${messageEditLog}`)]});
  }
};
