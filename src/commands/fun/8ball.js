//Dependencies and const:
const {MessageEmbed} = require('discord.js');
const answers = [
    'It is certain.',
    'It is decidedly so.',
    'Without a doubt.',
    'Yes - definitely.',
    'You may rely on it.',
    'As I see it, yes.',
    'Most likely.',
    'Outlook good.',
    'Yes.',
    'Signs point to yes.',
    'Reply hazy, try again.',
    'Ask again later.',
    'Better not tell you now.',
    'Cannot predict now.',
    'Concentrate and ask again.',
    'Don\'t count on it.',
    'My reply is no.',
    'My sources say no.',
    'Outlook not so good.',
    'Very doubtful.'
];
// Command Require:
const Command = require('../Command.js');

// Command Definition:
module.exports = class EightBallCommand extends Command {
    constructor(client) {
        super(client, {
            name: '8ball',
            aliases: ['fortune'],
            usage: '8ball <question>',
            description: 'Asks the Magic 8-Ball for some psychic wisdom.',
            type: client.types.FUN,
            examples: ['8ball Am I going to win the lottery?']
        });
    }

    // Command Code:
    async run(message, args) {

        // Define the question:
        const question = args.join(' ');
        // Check if the question is empty:
        if (!question) return this.sendErrorMessage(message, 0, 'Please provide a question to ask');
        // Send the answer:
        const embed = new MessageEmbed()
            .setTitle('🎱  The Magic 8-Ball  🎱')
            .addField('Question', question)
            .addField('Answer', `${answers[Math.floor(Math.random() * answers.length)]}`)
            .setFooter({
                text: `${this.client.credentials.name} | Question by ${message.member.displayName}`,
                iconURL: message.author.displayAvatarURL({dynamic: true})
            })
            .setTimestamp()
            .setColor(message.guild.me.displayHexColor);
        message.channel.send({embeds: [embed]});
    }
};
