const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class SetMessageDeleteLogCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setmessagedeletelog',
      aliases: ['setmsgdeletelog', 'setmdl', 'smdl'],
      usage: 'setmessagedeletelog <channel mention/ID>',
      description: oneLine`
        Sets the message delete log text channel for your server. 
        Provide no channel to clear the current \`message delete log\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setmessagedeletelog #bot-log']
    });
  }
  async run(message, args) {
    const messageDeleteLogId = await message.client.mongodb.settings.selectMessageDeleteLogId(message.guild.id);
    const oldMessageDeleteLog = message.guild.channels.cache.get(messageDeleteLogId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Logging`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`message delete log\` was successfully updated. ${success}`)
      .setFooter({text: `${message.member.displayName}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      await message.client.mongodb.settings.updateMessageDeleteLogId(null, message.guild.id);
      return message.channel.send({embed: [embed.addField('Message Delete Log', `${oldMessageDeleteLog} ➔ \`None\``)]});
    }

    const messageDeleteLog = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
    if (!messageDeleteLog || messageDeleteLog.type !== 'GUILD_TEXT' || !messageDeleteLog.viewable)
      return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text channel or provide a valid text channel ID
      `);
      await message.client.mongodb.settings.updateMessageDeleteLogId(messageDeleteLog.id, message.guild.id);
    message.channel.send({embeds: [embed.addField('Message Delete Log', `${oldMessageDeleteLog} ➔ ${messageDeleteLog}`)]});
  }
};
