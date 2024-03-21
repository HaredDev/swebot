const { Client, GatewayIntentBits, CommandInteractionOptionResolver  } = require('discord.js');
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
    if (!interaction.isCommand()) return;

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
        const channelArgument = options.getUser('channel');

        if(hasPerms(member.roles.cache) || channelArgument.guildId != channel.guildId){

            await interaction.reply({
                content: 'Write your message!',
                components: [
                    {
                        type: 'ACTION_ROW',
                        components: [
                            {
                                type: 'BUTTON',
                                label: 'As Embed msg',
                                style: 'PRIMARY',
                                customId: 'embed'
                            },
                            {
                                type: 'BUTTON',
                                label: 'As Normal msg',
                                style: 'PRIMARY',
                                customId: 'std'
                            },
                            {
                                type: 'msg',
                                customId: 'msg_input',
                                placeholder: 'Type your message here...',
                                minValues: 1,
                                maxValues: 1,
                                options: [],
                                data: JSON.stringify({channel : channelArgument.id})
                            }
                        ]
                    }
                ]
            });

        } else {

            try {
                await interaction.reply({ content: "You don't have the required role or the channel is not in the same server as where the command was executed!", ephemeral: true });
            } catch (error) {
                console.error('Failed to send ephemeral message:', error);
            }
            return;

        }



        if(interaction.isButton()){
            const buttonId = interaction.customId;
            const message = interaction.message;

            const content = message.components[0].components.find(component => component.type === 'msg_input').values[0];
            const channel = JSON.parse(message.components[0].components.find(component => component.type === 'msg_input').data).channel;

            if(buttonId === 'std')
                client.channels.fetch(channel).send(content);
            else if(buttonId === 'embed')
                client.channels.fetch(channel).send({ embeds: [new MessageEmbed(content)] });
        }


    }

});

client.login(cred.token);