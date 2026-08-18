const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
let guildsCollection;

client.on('error', err => {
  console.error('MongoDB client error:', err.message);
});

async function connect() {
  if (guildsCollection) return guildsCollection;
  try {
    await client.connect();
    const db = client.db('discord-custom-bot');
    guildsCollection = db.collection('guilds');
    console.log('Connected to MongoDB.');
    return guildsCollection;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    throw err;
  }
}

async function getGuildData(guildId) {
  const col = await connect();
  let doc = await col.findOne({ _id: guildId });
  if (!doc) {
    doc = { _id: guildId, prefix: 'Siri', commands: {} };
    await col.insertOne(doc);
  }
  return doc;
}

async function setPrefix(guildId, newPrefix) {
  const col = await connect();
  await col.updateOne(
    { _id: guildId },
    { $set: { prefix: newPrefix }, $setOnInsert: { commands: {} } },
    { upsert: true }
  );
}

async function addCommand(guildId, name, response, target, description) {
  const col = await connect();
  const key = name.toLowerCase();
  await col.updateOne(
    { _id: guildId },
    {
      $set: { [`commands.${key}`]: { response, target: !!target, description: description || '' } },
      $setOnInsert: { prefix: 'Siri' }
    },
    { upsert: true }
  );
}

async function removeCommand(guildId, name) {
  const col = await connect();
  const key = name.toLowerCase();
  const doc = await col.findOne({ _id: guildId });
  if (!doc || !doc.commands || !doc.commands[key]) return false;
  await col.updateOne({ _id: guildId }, { $unset: { [`commands.${key}`]: '' } });
  return true;
}

module.exports = { getGuildData, setPrefix, addCommand, removeCommand };