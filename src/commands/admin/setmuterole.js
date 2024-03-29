const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const { success } = require('../../utils/emojis.json');

module.exports = class SetMuteRoleCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setmuterole',
      aliases: ['setmur', 'smur'],
      usage: 'setmuterole <role mention/ID>',
      description: 'Sets the `mute role` your server. Provide no role to clear the current `mute role`.',
      type: client.types.ADMIN,
      userPermissions: ['MANAGE_GUILD'],
      clientPermissions: ['MANAGE_ROLES'],
      examples: ['setmuterole @Muted']
    });
  }
  async run(message, args) {
    const muteRoleId = await message.client.mongodb.settings.selectMuteRoleId(message.guild.id);
    const oldMuteRole = message.guild.roles.cache.find(r => r.id === muteRoleId) || '`None`';

    const embed = new MessageEmbed()
      .setTitle('Settings: `System`')
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setDescription(`The \`mute role\` was successfully updated. ${success}`)
      .setFooter({text: message.member.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true })})
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);

    // Clear if no args provided
    if (args.length === 0) {
      await message.client.mongodb.settings.updateMuteRoleId(null, message.guild.id);
      return message.channel.send({embeds:[embed.addField('Mute Role', `${oldMuteRole} ➔ \`None\``)]});
    }

    // Update role
    const muteRole = this.getRoleFromMention(message, args[0]) || message.guild.roles.cache.get(args[0]);
    if (!muteRole) return this.sendErrorMessage(message, 0, 'Please mention a role or provide a valid role ID');
    await message.client.mongodb.settings.updateMuteRoleId(muteRole.id, message.guild.id);
    message.channel.send({embeds:[embed.addField('Mute Role', `${oldMuteRole} ➔ ${muteRole}`)]});
  }
};
