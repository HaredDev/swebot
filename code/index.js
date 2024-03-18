const { Client, GatewayIntentBits, CommandInteractionOptionResolver  } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const jsonUtils = require('./jsonUtils.js');
const fs = require('fs');
const commands = require("../code/commands.json");
const cred = require("../cred/loginfo.json");
let storage = JSON.parse('{}');

loadStorage()

function loadStorage() {
    let data = fs.readFileSync('../code/storage.json', 'utf8');
    data = jsonUtils.checkAndMergeJSON(storage, JSON.parse(data));
    storage = JSON.parse(data);
}

function updateFile() {
   
    loadStorage();

    fs.writeFileSync('../code/storage.json', JSON.stringify(storage, null, 2), 'utf8', (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log('Data has been written to file');
      });

}

function hasPerms(member){
    let hasRole = false;
    storage.permRoles.forEach(element => {
        if(member.has(element)){
            hasRole = true;
        }
    });
    return hasRole;
}

function permChannel(id){
    return storage.channels.includes(id);
}

client.once('ready', async () => {

    try {
        const rest = new REST({version: '9'}).setToken(cred.token);

        console.log('Loading commands!');

        await rest.put(
            Routes.applicationCommands(cred.clientId),
            { body: commands}
        );

        console.log('Commands loaded!');

    } catch(e) {
        console.log(e);
    }
    setInterval(updateFile, 5000);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, member, channel, options } = interaction;

    if (commandName === 'set') {
        if(hasPerms(member.roles.cache)){

            if(!storage.channels.includes(channel.id))
                storage.channels.push(channel.id);

            try {
                await interaction.reply({ content: "Channel is set!", ephemeral: true });
            } catch (error) {
                console.error('Failed to send ephemeral message:', error);
            }
            return;

        } else {

            try {
                await interaction.reply({ content: "You don't have the required role.", ephemeral: true });
            } catch (error) {
                console.error('Failed to send ephemeral message:', error);
            }
            return;

        }       
    } else if (commandName === 'spank') {
        const userArgument = options.getUser('user');

        if(!permChannel(channel.id)){
            await interaction.reply({ content: "This channel is not a command channel.", ephemeral: true });
            return;
        }

        if (userArgument) {
            const user = await client.users.fetch(userArgument.id);

            let count = 0;

            if(storage.spanks.hasOwnProperty(user.username)){
                count = storage.spanks[user.username];
            }

            count++;

            storage.spanks[user.username] = count;

            interaction.reply(`<@${member.id}> spanks <@${user.id}> ` + count + ' times!');
        } else {
            await interaction.reply({ content: "Missing argument \'user\'.", ephemeral: true });
        }
    }

});

client.login(cred.token);