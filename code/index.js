const { Client, ChannelType, PermissionsBitField, GatewayIntentBits, ButtonBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { InteractionResponseType } = require('discord-interactions');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const jsonUtils = require('./jsonUtils.js');
const fs = require('fs');
const commands = require("../code/commands.json");
const cred = require("../cred/loginfo.json");
const { channel } = require('diagnostics_channel');
const { memoryUsage } = require('process');
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

    const { commandName, member, channel, options } = interaction;
    if (interaction.isCommand()){

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

                let count = Math.floor(Math.random() * 210);

                interaction.reply(`<@${member.id}> spanks <@${user.id}> ` + count + ' times!');
            } else {
                await interaction.reply({ content: "Missing argument \'user\'.", ephemeral: true });
            }
        } else if (commandName === 'msgasbot') {
            const channelArgument = options.getChannel('channel');
            const embedArgument = options.getBoolean('embed');
            
            if(hasPerms(member.roles.cache) || channelArgument.guildId != channel.guildId){

                const modal = new ModalBuilder()
                .setCustomId('msgcustominput')
                .setTitle('Write your message');

                const msg = new TextInputBuilder()
                .setCustomId('msg')
                .setLabel('The message to write')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)

                storage.msgcustominput = {
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

            }
        } else if (commandName === 'msgmod') {
            if(hasPerms(member.roles.cache)) {

                const button = new ButtonBuilder()
                    .setCustomId('createTicket')
                    .setLabel('Create Ticket')
                    .setStyle(ButtonStyle.Primary);

                const row = new ActionRowBuilder()
                    .addComponents(button);

                channel.send({
                    content : 'Press the \"Create Ticket\" button to create a ticket. You can only create one ticket at a time!',
                    components : [row]
                });

                await interaction.reply({ content: "Button created!", ephemeral: true });

            }
        }

    }

    if(interaction.isButton()){

        let member = interaction.user;
        if(interaction.customId === 'createTicket') {
            if('ticketCh' in storage){
                if(storage.ticketCh.includes(member.username)){
                    await interaction.reply({ content: "You already have a ticket opened!", ephemeral: true });
                    return;
                }
                storage.ticketCh.push(member.username);
            } else {
                storage.ticketCh = [
                    member.username
                ];
            }
            const ch = await channel.guild.channels.create({
                name : member.username,
                type: ChannelType.GuildText,
                parent: channel.parent,
                permissionOverwrites: [
                    {
                        id: channel.guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: member.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: channel.guild.roles.cache.find(r => r.name === 'moderator').id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });

            const button = new ButtonBuilder()
            .setCustomId('deleteTicket')
            .setLabel('Delete Ticket')
            .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(button);

            const sentMessage = await ch.send({
                content : '',
                components : [row]
            });
            
            ch.send(`<@&${ch.guild.roles.cache.find(r => r.name === 'moderator').id}>`);
            
            sentMessage.pin();

            

            await interaction.deferUpdate();

        }

        if(interaction.customId === 'deleteTicket') {
            const buttonYes = new ButtonBuilder()
            .setCustomId('deleteSure')
            .setLabel('Yes I\'m sure')
            .setStyle(ButtonStyle.Danger);

            const buttonNo = new ButtonBuilder()
            .setCustomId('deleteNo')
            .setLabel('No I\'m not')
            .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(buttonYes, buttonNo);

            channel.send({
                content : 'Are you sure?',
                components : [row]
            });
            await interaction.deferUpdate();
        }

        if(interaction.customId === 'deleteSure') {
            storage.ticketCh = storage.ticketCh.filter(str => str !== member.username);
            channel.delete();
        }

        if(interaction.customId === 'deleteNo') {
            const msg = await channel.messages.fetch(interaction.message.id);
            msg.delete();
        }

    }

    if(interaction.isModalSubmit()){

        if(interaction.customId === 'msgcustominput') {
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