require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits } = require('discord.js');
const express = require('express');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// ---------- storage ----------

function loadData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ guilds: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getGuildData(guildId) {
  const data = loadData();
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = { prefix: 'Siri', commands: {} };
    saveData(data);
  }
  return data.guilds[guildId];
}

function setPrefix(guildId, newPrefix) {
  const data = loadData();
  if (!data.guilds[guildId]) data.guilds[guildId] = { prefix: 'Siri', commands: {} };
  data.guilds[guildId].prefix = newPrefix;
  saveData(data);
}

function addCommand(guildId, name, response, target, description) {
  const data = loadData();
  if (!data.guilds[guildId]) data.guilds[guildId] = { prefix: 'Siri', commands: {} };
  data.guilds[guildId].commands[name.toLowerCase()] = {
    response,
    target: !!target,
    description: description || ''
  };
  saveData(data);
}

function removeCommand(guildId, name) {
  const data = loadData();
  if (!data.guilds[guildId]) return false;
  const existed = name.toLowerCase() in data.guilds[guildId].commands;
  delete data.guilds[guildId].commands[name.toLowerCase()];
  saveData(data);
  return existed;
}

// ---------- client ----------

function isModOrAdmin(interaction) {
  const perms = interaction.memberPermissions;
  if (!perms) return false;
  return (
    perms.has(PermissionFlagsBits.Administrator) ||
    perms.has(PermissionFlagsBits.ManageGuild) ||
    perms.has(PermissionFlagsBits.ModerateMembers)
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ---------- slash command handling ----------

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'addcommand': {
        if (!isModOrAdmin(interaction)) {
          return interaction.reply({ content: 'Only admins or moderators can add commands.', ephemeral: true });
        }

        const name = interaction.options.getString('name').trim().toLowerCase();
        const response = interaction.options.getString('response');
        const target = interaction.options.getBoolean('target') ?? false;
        const description = interaction.options.getString('description') ?? '';

        if (/\s/.test(name)) {
          return interaction.reply({ content: 'Command name cannot contain spaces.', ephemeral: true });
        }

        addCommand(interaction.guildId, name, response, target, description);
        const guildData = getGuildData(interaction.guildId);
        return interaction.reply({
          content: `Custom command \`${name}\` added. Use it as \`${guildData.prefix} ${name}\`.${target ? ' It requires a @target mention — the tagged user is added automatically.' : ''}`,
          ephemeral: true
        });
      }

      case 'removecommand': {
        if (!isModOrAdmin(interaction)) {
          return interaction.reply({ content: 'Only admins or moderators can remove commands.', ephemeral: true });
        }

        const name = interaction.options.getString('name').trim().toLowerCase();
        const existed = removeCommand(interaction.guildId, name);
        return interaction.reply({
          content: existed ? `Removed \`${name}\`.` : `No command named \`${name}\` found.`,
          ephemeral: true
        });
      }

      case 'setprefix': {
        if (!isModOrAdmin(interaction)) {
          return interaction.reply({ content: 'Only admins or moderators can change the prefix.', ephemeral: true });
        }

        const prefix = interaction.options.getString('prefix').trim();
        if (prefix.length === 0 || prefix.length > 5 || /\s/.test(prefix)) {
          return interaction.reply({ content: 'Prefix must be 1-5 characters with no spaces.', ephemeral: true });
        }
        setPrefix(interaction.guildId, prefix);
        return interaction.reply({ content: `Prefix updated to \`${prefix}\`.`, ephemeral: true });
      }

      case 'listcommands': {
        const guildData = getGuildData(interaction.guildId);
        const names = Object.keys(guildData.commands);
        if (names.length === 0) {
          return interaction.reply({ content: 'No custom commands set up yet.', ephemeral: true });
        }
        const list = names.map(n => {
          const c = guildData.commands[n];
          let line = c.target
            ? `\`${guildData.prefix} ${n} {@target}\``
            : `\`${guildData.prefix} ${n}\``;
          if (c.description) line += ` — ${c.description}`;
          return line;
        }).join('\n');
        return interaction.reply({ content: list, ephemeral: true });
      }
    }
  } catch (err) {
    console.error(err);
    const payload = { content: 'Something went wrong running that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

// ---------- custom prefix command handling: <prefix><name> [@target] ----------

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  const guildData = getGuildData(message.guild.id);
  const prefix = guildData.prefix;

  if (!message.content.startsWith(prefix)) return;

  const withoutPrefix = message.content.slice(prefix.length).trim();
  const [rawName] = withoutPrefix.split(/\s+/);
  const commandName = (rawName || '').toLowerCase();
  if (!commandName) return;

  const cmd = guildData.commands[commandName];
  if (!cmd) {
    return message.reply(`\`${commandName}\` is not a command. To see all commands, use \`/listcommands\`.`);
  }

  let responseText = cmd.response;

  if (cmd.target) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply(`This command needs a target. Usage: \`${prefix} ${commandName} @user\``);
    }
    const mention = `<@${targetUser.id}>`;
    // If the response text has a {target} placeholder, fill it in.
    // Otherwise just tag the user at the end automatically.
    responseText = responseText.includes('{target}')
      ? responseText.replaceAll('{target}', mention)
      : `${responseText} ${mention}`;
  }

  await message.reply(responseText);
});

// Keep-alive web server
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 3000);

client.login(process.env.BOT_TOKEN);