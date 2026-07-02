// Keep-alive web server
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);

const { Client , IntentsBitField , EmbedBuilder, inlineCode } = require('discord.js');
require('dotenv').config();
 
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,     
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
})

client.on('clientReady', (c) => {
    console.log(`Logged in as ${c.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.content === 'hello') {
        message.reply('hello there!');
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'hey') {
        await interaction.reply('Hello!  '  + interaction.user.displayName );
    }

    if (interaction.commandName === 'add') {
        const num1 = interaction.options.getNumber('num1');
        const num2 = interaction.options.getNumber('num2');
        const sum = num1 + num2;
        await interaction.reply(`The sum of ${num1} and ${num2} is ${sum}.`);
    }

    if (interaction.commandName === 'embed') {
        const embed = new EmbedBuilder()
            .setTitle('This is title')
            .setDescription('This is description')
            .setColor('Random')
            .addFields({ name: 'Field 1', value: 'This is field 1' })
            .addFields({ name: 'Field 2', value: 'This is field 2' })
            .addFields({ name: 'Field 3', value: 'This is field 3', inline: true })
            .addFields({ name: 'Field 4', value: 'This is field 4', inline: true });
        await interaction.reply({ embeds: [embed] });
    }
});

client.login(process.env.TOKEN);
