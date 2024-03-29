const Command = require('../Command.js');
const { MessageEmbed } = require('discord.js');
const ms = require('ms');

module.exports = class MuteCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'mute',
      usage: 'mute <user mention/ID> [time] [reason]',
      description: 'Mutes a user for the specified amount of time (max 1 month).',
      type: client.types.MOD,
      clientPermissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_ROLES'],
      userPermissions: ['MANAGE_ROLES'],
      examples: ['mute @MDC 10s', 'mute @MDC 30m talks too much']
    });
  }
  async run(message, args) {

    const muteRoleId = await message.client.mongodb.settings.selectMuteRoleId(message.guild.id);
    let muteRole;
    if (muteRoleId) muteRole = message.guild.roles.cache.get(muteRoleId);
    else return this.sendErrorMessage(message, 1, 'There is currently no mute role set on this server');

    const member = this.getMemberFromMention(message, args[0]) || message.guild.members.cache.get(args[0]);
    if (!member) 
      return this.sendErrorMessage(message, 0, 'Please mention a user or provide a valid user ID');
    if (member === message.member)
      return this.sendErrorMessage(message, 0, 'You cannot mute yourself');
    if (member === message.guild.me) return this.sendErrorMessage(message, 0, 'You cannot mute me');
    if (member.roles.highest.position >= message.member.roles.highest.position)
      return this.sendErrorMessage(message, 0, 'You cannot mute someone with an equal or higher role');
    if (!args[1]){
      await member.roles.add(muteRole)
      const muteEmbed = new MessageEmbed()
      .setTitle('Mute Member')
      .setDescription(`${member} has now been muted`)
      .addField('Moderator', `${message.member}`, true)
      .addField('Member', `${member}`, true)
      .addField('Time', `\`Not specified\``, true)
      .addField('Reason', `\`Not specified\``, true)
      .setFooter({
        text: message.member.displayName,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
      return message.channel.send({embeds: [muteEmbed]});
    }
    let time = ms(args[1]);
    if (!time || time > 2.628e+9)
      return this.sendErrorMessage(message, 0, 'Please enter a length of time of 1 month or less (1s/m/h/d)');

    let reason = args.slice(2).join(' ');
    if (!reason) reason = '`None`';
    if (reason.length > 1024) reason = reason.slice(0, 1021) + '...';

    if (member.roles.cache.has(muteRoleId))
      return this.sendErrorMessage(message, 0, 'Provided member is already muted');

    // Mute member
    try {
      await member.roles.add(muteRole);
    } catch (err) {
      message.client.logger.error(err.stack);
      return this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
    }
    const muteEmbed = new MessageEmbed()
      .setTitle('Mute Member')
      .setDescription(`${member} has now been muted for **${ms(time, { long: true })}**.`)
      .addField('Moderator', `${message.member}`, true)
      .addField('Member', `${member}`, true)
      .addField('Time', `\`${ms(time)}\``, true)
      .addField('Reason', reason)
      .setFooter({
        text: message.member.displayName,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp()
      .setColor(message.guild.me.displayHexColor);
    message.channel.send({embeds: [muteEmbed]});

    // Unmute member
    member.timeout = message.client.setTimeout_(async () => {
      try {
        await member.roles.remove(muteRole);
        const unmuteEmbed = new MessageEmbed()
          .setTitle('Unmute Member')
          .setDescription(`${member} has been unmuted.`)
          .setTimestamp()
          .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [unmuteEmbed]});
      } catch (err) {
        message.client.logger.error(err.stack);
        return this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
      }
    }, time);

    // Update mod log
    await this.sendModLogMessage(message, reason, {Member: member, Time: `\`${ms(time)}\``});
  }
};
