const moment = require('moment-timezone');

const timeZone = 'Europe/London';
const regex = /^\d{4}-\d{2}-\d{2}$/;
const channelID = "1216472875058462720";

class Birthday{

    constructor(core){
        this.core = core;
    }

    commandName(){
        return 'birthday';
    }

    async onCommand(interaction){
        const { member, channel, options } = interaction;
        const dateString = options.getString('date');
        const user = options.getUser("user");
        let storage = this.core.storage;

        if (user == null && dateString == null) {
            try {
                await interaction.reply({ content: "You have to either input a user or your birthday!", ephemeral: true });
            } catch (error) {
                console.error('Failed to send ephemeral message:', error);
            }
            return;
        } else if (user != null) {
            if(Array.isArray(storage["birthdays"])) {
                storage.birthdays.forEach(time => {
                    if(time.user == user.id) {
                        try {
                            interaction.reply({ content: "The birthday of " + `<@${user.id}>` + " is " + time.date, ephemeral: true });
                        } catch (error) {
                            console.error('Failed to send ephemeral message:', error);
                        }
                        return;
                    }
                });
                try {
                    await interaction.reply({ content: "That user hasn't set their birthday yet!", ephemeral: true });
                } catch (error) {
                    console.error('Failed to send ephemeral message:', error);
                }
                return;
            } else {
                try {
                    await interaction.reply({ content: "There are no birthdays added yet!", ephemeral: true });
                } catch (error) {
                    console.error('Failed to send ephemeral message:', error);
                }
                return;
            }
        } else if (!regex.test(dateString)) {
            try {
                await interaction.reply({ content: "The date was in a wrong format! It should be in yyyy-mm-dd", ephemeral: true });
            } catch (error) {
                console.error('Failed to send ephemeral message:', error);
            }
            return;
        } else {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            if(!( date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day )) {
                try {
                    await interaction.reply({ content: "The date was in a wrong format! It should be in yyyy-mm-dd", ephemeral: true });
                } catch (error) {
                    console.error('Failed to send ephemeral message:', error);
                }
                return;
            }
        }
        
        let newDate =  {
                user: member.id,
                date: dateString,
                hasSaid: false
            };

        if(Array.isArray(storage.birthdays)) {
            let userExist = false;
            storage.birthdays.forEach(time => {
                if(time.user == newDate.user) {
                    time.date = newDate.date;
                    userExist = true;
                }
            });
            if(!userExist)
                storage.birthdays.push(newDate);
        } else {
            storage.birthdays = [newDate];
        }

        try {
            await interaction.reply({ content: "Your birthday was updated!", ephemeral: true });
        } catch (error) {
            console.error('Failed to send ephemeral message:', error);
        }

    }

    async onUpdate() {
        let storage = this.core.storage;
        if(!Array.isArray(storage["birthdays"]))
            return;
        const currentTime = moment().tz(timeZone).format('YYYY-MM-DD');
        storage.birthdays.forEach(time => {
            if(time.date.substring(5) == currentTime.substring(5) && !time.hasSaid) {
                let age = this.calculateYearsBetween(time.date, currentTime);
                this.sendBdMessage(time.user, age);
                time.hasSaid = true;
            } else if(time.date.substring(5) != currentTime.substring(5) && time.hasSaid) {
                time.hasSaid = false;
            }
        });
    }

    async sendBdMessage(userID, age) {
        let channel = this.core.dcClient.channels.cache.get(channelID);
        const embed = this.core.createEmbedBuilder();
        embed.setTitle("It's someones birthday today!");
        embed.setDescription("# It's " + `<@${userID}>` + " birthday today!\nThey are now " + age + " years old!\nHappy Birthday! " + `<@${userID}>`);
        let msg = { embeds: [embed] };
        channel.send(msg);
    }

    calculateYearsBetween(date1, date2) {
        const startDate = new Date(date1);
        const endDate = new Date(date2);
        
        let yearsDifference = endDate.getFullYear() - startDate.getFullYear();
        
        const startMonthDay = startDate.getMonth() * 100 + startDate.getDate();
        const endMonthDay = endDate.getMonth() * 100 + endDate.getDate();
        
        if (endMonthDay < startMonthDay) {
          yearsDifference -= 1;
        }
        
        return yearsDifference;
    }

}

module.exports = { Birthday };