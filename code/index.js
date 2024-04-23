const { Client, ChannelType, PermissionsBitField, GatewayIntentBits, ButtonBuilder, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { InteractionResponseType } = require('discord-interactions');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const jsonUtils = require('./jsonUtils.js');
const fs = require('fs');
const commands = require("../code/commands.json");
const cred = require("../cred/loginfo.json");
const { channel } = require('diagnostics_channel');
const { memoryUsage } = require('process');
const { time, Console } = require('console');


class Core{

storage = JSON.parse('{}');

TextInputStyle = TextInputStyle;
ButtonStyle = ButtonStyle;
ChannelType = ChannelType;
PermissionsBitField = PermissionsBitField;
InteractionResponseType = InteractionResponseType;
dcClient = client;

    constructor(){
        
        const {MsgMod} = require('./commands/msgmod.js');
        const {MsgAsBot} = require('./commands/msgasbot.js');
        const {Set} = require('./commands/set.js');
        const {Spank} = require('./commands/spank.js');

        const commandObj = [
            new MsgMod(this),
            new MsgAsBot(this),
            new Set(this),
            new Spank(this)
        ]


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
            setInterval(function() {
                this.updateFile();
            }.bind(this), 5000);
        });

        client.on('interactionCreate', async interaction => {

            if (interaction.isCommand()){
                const { commandName } = interaction;
                commandObj.forEach(element => {
                    if(this.hasFunction(element.onCommand) && element.commandName() === commandName){
                    element.onCommand(interaction);
                    }
                });

            }
        
            if(interaction.isButton()){
                commandObj.forEach(element => {
                    if(this.hasFunction(element.onButton)){
                        element.onButton(interaction);
                    }
                });
            }
        
            if(interaction.isModalSubmit()){
                commandObj.forEach(element => {
                    if(this.hasFunction(element.onModal)){
                        element.onModal(interaction);
                    }
                });
            }
        
        });

        client.on("messageCreate", async (message) => {
            if(message.author.bot) return false;
            if(message.stickers.size > 0 || message.attachments.size > 0 || message.channel.id === '1216467034490011742') return false;
            let guild = message.guild;
            let user = await guild.members.fetch(message.author.id);
            if(!this.hasPerms(user.roles.cache) && message.content == ''){
                message.delete();
                const mes = await message.channel.send(`<@${user.id}> You are not allowed to create polls!`);
                setTimeout(function (){
                    mes.delete();
                }, 3000)
            }
        });

    }


    hasFunction(func){
        return typeof func === 'function';
    }

    loadStorage() {
        let data = fs.readFileSync('../code/storage.json', 'utf8');
        data = jsonUtils.checkAndMergeJSON((this.storage), JSON.parse(data));
        this.storage = JSON.parse(data);
    }

    updateFile() {

        this.loadStorage();

        fs.writeFileSync('../code/storage.json', JSON.stringify(this.storage, null, 2), 'utf8', (err) => {
            if (err) {
            console.error(err);
            return;
            }
            console.log('Data has been written to file');
        });

    }

    hasPerms(member){
        let hasRole = false;
        this.storage.permRoles.forEach(element => {
            if(member.has(element)){
                hasRole = true;
            }
        });
        return hasRole;
    }

    permChannel(id){
        return this.storage.channels.includes(id);
    }


    createButton(){
        return new ButtonBuilder();
    }

    createActionRowBuilder(){
        return new ActionRowBuilder();
    }

    createModalBuilder(){
        return new ModalBuilder();
    }

    createTextInputBuilder(){
        return new TextInputBuilder();
    }

    createEmbedBuilder(){
        return new EmbedBuilder();
    }

    runCore(){
        this.loadStorage()
        client.login(cred.token);
    }
}

let core = new Core().runCore();