const { Client, GatewayIntentBits, CommandInteractionOptionResolver, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { InteractionResponseType } = require('discord-interactions');
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
    if (interaction.isCommand()){

        const { commandName, member, channel, options } = interaction;

        //set
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

        //spank       
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
        } else if (commandName === "msgasbot") {
            const channelArgument = options.getChannel('channel');
            const embedArgument = options.getBoolean('embed');
            
            if(hasPerms(member.roles.cache) || channelArgument.guildId != channel.guildId){

                const modal = new ModalBuilder()
                .setCustomId('msginput')
                .setTitle('Write your message');

                const msg = new TextInputBuilder()
                .setCustomId('msg')
                .setLabel('The message to write')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)

                storage.msginput = {
                    channel : channelArgument.id,
                    embed : embedArgument
                }
                

                const first = new ActionRowBuilder().addComponents(msg);

                modal.addComponents(first);
                await interaction.showModal(modal);

            } else {

                try {
                    await interaction.reply({ content: "You don't have the required role or the channel is not in the same server as where the command was executed!", ephemeral: true });
                } catch (error) {
                    console.error('Failed to send ephemeral message:', error);
                }
                return;

            }
        }

    }


    if(interaction.isModalSubmit()){

        if(interaction.customId === "msginput"){
            let data = storage[interaction.customId];
            let msg = interaction.fields.getTextInputValue('msg');
            const channel = await client.channels.fetch(data.channel);
            if(data.embed){
                const embed = new EmbedBuilder().setDescription(msg);
                msg = { embeds: [embed] };
            }
                await channel.send(msg);

            delete storage[interaction.customId];
            interaction.reply({
                content: 'Message sent!',
                ephemeral: true
            });
            
        }
    }

});

client.login(cred.token);