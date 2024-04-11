class MsgAsBot{

    constructor(core){
        this.core = core;
    }

    commandName(){
        return 'msgasbot';
    }

    async onCommand(interaction){
        const { member, channel, options } = interaction;
        const channelArgument = options.getChannel('channel');
        const embedArgument = options.getBoolean('embed');
            
            if(this.core.hasPerms(member.roles.cache) || channelArgument.guildId != channel.guildId){

                const modal = this.core.createModalBuilder()
                .setCustomId('msgcustominput')
                .setTitle('Write your message');

                const msg = this.core.createTextInputBuilder()
                .setCustomId('msg')
                .setLabel('The message to write')
                .setStyle(this.core.TextInputStyle.Paragraph)
                .setRequired(true)

                this.core.storage.msgcustominput = {
                    channel : channelArgument.id,
                    embed : embedArgument
                }
                
                

                const first = this.core.createActionRowBuilder().addComponents(msg);

                modal.addComponents(first);
                await interaction.showModal(modal);

            } else {

                try {
                    await interaction.reply({ content: "You don't have the required role or the channel is not in the same server as where the command was executed!", ephemeral: true });
                } catch (error) {
                    console.error('Failed to send ephemeral message:', error);
                }

            }
    }

    async onModal(interaction){
        if(interaction.customId === 'msgcustominput') {
            let data = this.core.storage[interaction.customId];
            let msg = interaction.fields.getTextInputValue('msg');
            const channel = await this.core.dcClient.channels.fetch(data.channel);
            if(data.embed){
                const embed = this.core.createEmbedBuilder().setDescription(msg);
                msg = { embeds: [embed] };
            }
                await channel.send(msg);

            delete this.core.storage[interaction.customId];
            interaction.reply({
                content: 'Message sent!',
                ephemeral: true
            });
        }

    }

}

module.exports = { MsgAsBot };