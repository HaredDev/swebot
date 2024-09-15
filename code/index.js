const { Client, ChannelType, PermissionsBitField, GatewayIntentBits, ButtonBuilder, WebhookClient, TextInputBuilder, TextInputStyle, ModalBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
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

hooks = [];

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
        const {Birthday} = require('./commands/birthday.js');
        const {Insta} = require('./commands/Insta.js');

        const commandObj = [
            new MsgMod(this),
            new MsgAsBot(this),
            new Set(this),
            new Spank(this),
            new Birthday(this),
            new Insta(this)
        ]


        client.once('ready', async () => {

            try {
                const rest = new REST({version: '9'}).setToken(cred.token); 
                
                this.hooks[0] = await this.checkAndCreateWebHooks("1216472875058462720", "Birthday Time", "https://www.dropbox.com/scl/fi/ec6ft1jp9os0w581nps5o/birthday-cake.png?rlkey=k76yg57kfeggmvai7xzv1buu6&st=at8lrykq&dl=1");
                this.hooks[1] = await this.checkAndCreateWebHooks("1216467389290385561", "Insta Updates", "https://www.dropbox.com/scl/fi/pp4eh3aqn18nkcn96wcje/insta.png?rlkey=pkfd6rq9pfbqkeuslrcowggi0&st=v44bp5qv&dl=1");

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

        setInterval(function() {
            commandObj.forEach(element => {
                if(this.hasFunction(element.onUpdate)){
                    element.onUpdate();
                }
            });
        }.bind(this), 5000);

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
            if(message.stickers.size > 0 || message.attachments.size > 0 || message.type != 0) return false;
            let guild = message.guild;
            let user = await guild.members.fetch(message.author.id);
            console.log(message);
            if(!this.hasPerms(user.roles.cache) && message.content == ''){
                message.delete();
                const mes = await message.channel.send(`<@${user.id}> You are not allowed to create polls!`);
                setTimeout(function (){
                    mes.delete();
                }, 3000)
            }
        });

    }

    async checkAndCreateWebHooks(channelID, webhookName, imgUrl) {
        try {
            let channel = await this.dcClient.channels.fetch(channelID);
    
            const webhooks = await channel.fetchWebhooks();
            let webhook = webhooks.find(wh => wh.name === webhookName);
    
            if (webhook) {
                return webhook;
            } else {
               
                // Await the creation of the webhook and ensure all required fields are passed
                webhook = await channel.createWebhook({
                    avatar: imgUrl,
                    name: webhookName
                });
                
                return webhook;
            }
        } catch (error) {
            console.error('Error creating or fetching webhook:', error);
        }
    }

    async sendAsWebHook(webhookID, msg) {
        try {
    
            //const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });
            let webhook = this.hooks[webhookID];
            const avatarURL = `https://cdn.discordapp.com/avatars/${webhook.id}/${webhook.avatar}.png`;
            const name = webhook.name;

            //msg.setThumbnail(avatarURL);
            msg.setAuthor({ name: webhookID == 0 ? "Birthday Time" : "New Instagram Post", iconURL: avatarURL, url: msg.url})
            msg.setFooter({ text: 'Message sent by SveBot', iconURL: this.dcClient.user.avatarURL()});

            webhook.send({
                //content: msg,
                embeds: [msg],
                username: name,
                avatarURL: avatarURL
            }).catch(console.error);  // Error handling for send failures
        } catch (error) {
            console.error('Error sending webhook message:', error);
        }
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