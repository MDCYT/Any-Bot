const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');
const { oneLine, stripIndent } = require('common-tags');

module.exports = class SetRoleLogCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setrolelog',
      aliases: ['setrl', 'srl'],
      usage: 'setrolelog <channel mention/ID>',
      description: oneLine`
        Sets the role change log text channel for your server. 
        Provide no channel to clear the current \`role log\`.
      `,
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      examples: ['setrolelog #bot-log']
    });
  }
  async run(message, args) {
    const roleLogId = await message.client.mongodb.settings.selectRoleLogId(message.guild.id);
    const oldRoleLog = message.guild.channels.cache.get(roleLogId) || '`None`';
    const embed = new MessageEmbed()
      .setTitle('Settings: `Logging`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`role log\` was successfully updated. ${success}`)
      .setFooter({text: message.member.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true })})
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      await message.client.mongodb.settings.updateRoleLogId(null, message.guild.id);
      return message.channel.send({embeds:[embed.addField('Role Log', `${oldRoleLog} ➔ \`None\``)]});
    }

    const roleLog = this.getChannelFromMention(message, args[0]) || message.guild.channels.cache.get(args[0]);
    if (!roleLog || roleLog.type !== 'GUILD_TEXT' || !roleLog.viewable)
      return this.sendErrorMessage(message, 0, stripIndent`
        Please mention an accessible text channel or provide a valid text channel ID
      `);
    await message.client.mongodb.settings.updateRoleLogId(roleLog.id, message.guild.id);
    message.channel.send({embeds:[embed.addField('Role Log', `${oldRoleLog} ➔ ${roleLog}`)]});
  }
};
