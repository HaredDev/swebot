class MsgMod{

    constructor(core){
        this.core = core;
    }

    commandName(){
        return 'msgmod';
    }

    async onCommand(interaction){
        const { member, channel } = interaction;
        if(this.core.hasPerms(member.roles.cache)) {

            const button = this.core.createButton()
                .setCustomId('createTicket')
                .setLabel('Create Ticket')
                .setStyle(this.core.ButtonStyle.Primary);

            const row = this.core.createActionRowBuilder()
                .addComponents(button);

            channel.send({
                content : 'Press the \"Create Ticket\" button to create a ticket. You can only create one ticket at a time!',
                components : [row]
            });

            await interaction.reply({ content: "Button created!", ephemeral: true });

        }
    }

    async onButton(interaction){
        const { channel } = interaction;
        let member = interaction.user;
        if(interaction.customId === 'createTicket') {
            if('ticketCh' in this.core.storage){
                if(this.core.storage.ticketCh.includes(member.username)){
                    await interaction.reply({ content: "You already have a ticket opened!", ephemeral: true });
                    return;
                }
                this.core.storage.ticketCh.push(member.username);
            } else {
                this.core.storage.ticketCh = [
                    member.username
                ];
            }
            const ch = await channel.guild.channels.create({
                name : member.username,
                type: this.core.ChannelType.GuildText,
                parent: channel.parent,
                permissionOverwrites: [
                    {
                        id: channel.guild.roles.everyone.id,
                        deny: [this.core.PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: member.id,
                        allow: [this.core.PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: channel.guild.roles.cache.find(r => r.name === 'moderator').id,
                        allow: [this.core.PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });

            const button = this.core.createButton()
            .setCustomId('deleteTicket')
            .setLabel('Delete Ticket')
            .setStyle(this.core.ButtonStyle.Primary);

            const row = this.core.createActionRowBuilder()
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
            const buttonYes = this.core.createButton()
            .setCustomId('deleteSure')
            .setLabel('Yes I\'m sure')
            .setStyle(this.core.ButtonStyle.Danger);

            const buttonNo = this.core.createButton()
            .setCustomId('deleteNo')
            .setLabel('No I\'m not')
            .setStyle(this.core.ButtonStyle.Primary);

            const row = this.core.createActionRowBuilder()
                .addComponents(buttonYes, buttonNo);

            channel.send({
                content : 'Are you sure?',
                components : [row]
            });
            await interaction.deferUpdate();
        }

        if(interaction.customId === 'deleteSure') {
            this.core.storage.ticketCh = this.core.storage.ticketCh.filter(str => str !== member.username);
            channel.delete();
        }

        if(interaction.customId === 'deleteNo') {
            const msg = interaction.message;
            msg.delete();
        }


    }

}

module.exports = { MsgMod };