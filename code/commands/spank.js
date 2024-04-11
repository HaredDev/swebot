class Spank{

    constructor(core){
        this.core = core;
    }

    commandName(){
        return 'spank';
    }

    async onCommand(interaction){
        const { member, channel, options } = interaction;
        const userArgument = options.getUser('user');

            if(!this.core.permChannel(channel.id)){
                await interaction.reply({ content: "This channel is not a command channel.", ephemeral: true });
                return;
            }

            if (userArgument) {
                const user = await this.core.dcClient.users.fetch(userArgument.id);

                let count = Math.floor(Math.random() * 210);

                interaction.reply(`<@${member.id}> spanks <@${user.id}> ` + count + ' times!');
            } else {
                await interaction.reply({ content: "Missing argument \'user\'.", ephemeral: true });
            }
    }
}

module.exports = { Spank };