class Set{

    constructor(core){
        this.core = core;
    }

    commandName(){
        return 'set';
    }

    async onCommand(interaction){
        const { member, channel } = interaction;
        if(this.core.hasPerms(member.roles.cache)){

            if(!this.core.storage.channels.includes(channel.id))
            this.core.storage.channels.push(channel.id);

            try {
                await interaction.reply({ content: "Channel is set!", ephemeral: true });
            } catch (error) {
                console.error('Failed to send ephemeral message:', error);
            }

        } else {

            try {
                await interaction.reply({ content: "You don't have the required role.", ephemeral: true });
            } catch (error) {
                console.error('Failed to send ephemeral message:', error);
            }
        }
    }

}

module.exports = { Set };