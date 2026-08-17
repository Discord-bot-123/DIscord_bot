require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { REST, Routes, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

const commands = [
    {
        name: 'addcommand',
        description: 'Add a custom text command for this server.',
        default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
        options: [
            {
                name: 'name',
                description: 'Command name (no spaces, no prefix).',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'response',
                description: 'What the bot replies. Use {target} to insert the mentioned user.',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'target',
                description: 'Require a @user mention when this command is used (default: false).',
                type: ApplicationCommandOptionType.Boolean,
                required: false,
            },
            {
                name: 'description',
                description: 'Optional note about what this command does, shown in /listcommands.',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ],
    },
    {
        name: 'removecommand',
        description: 'Remove a custom text command from this server.',
        default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
        options: [
            {
                name: 'name',
                description: 'Command name to remove.',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    {
        name: 'setprefix',
        description: 'Change the prefix used for custom commands in this server.',
        default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
        options: [
            {
                name: 'prefix',
                description: 'New prefix, e.g. ! or ?',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    {
        name: 'listcommands',
        description: 'List all custom commands set up in this server.',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands (global).');

        // Global = works in every guild the bot joins, but takes up to ~1hr to propagate.
        // For instant testing in one server instead, use:
        // Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();