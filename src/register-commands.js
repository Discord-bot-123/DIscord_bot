require('dotenv').config();
const { REST, Routes , ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: 'hey',
        description: 'Replies with Hello!',
    },
    {
        name: 'add',
        description: 'Adds two numbers together.',
        options: [
            {
                name: 'num1',
                description: 'The first number.',
                type: ApplicationCommandOptionType.Number,
                choices: [
                    {
                        name: 'one',
                        value: 1
                    },
                    {
                        name: 'two',
                        value: 2
                    },
                    {
                        name: 'three',
                        value: 3
                    }
                ],
                required: true,
            },  
            {
                name: 'num2',
                description: 'The second number.',
                type: ApplicationCommandOptionType.Number,
                required: true,
            }
        ]
    },
    {
        name: 'embed',
        description: 'Sends an embedded message.',

    }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try{
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    }catch (error) {
        console.error(error);
    }
})();