const webhookID = 1;

class Insta{
timer = 0;

    constructor(core){
        this.core = core;
    }

    commandName(){
      return 'null';
    }

    async onUpdate() {
        if(this.timer != 0){
          this.timer++;
          return;
        } else if(this.timer >= 12) {
          this.timer = 1;
        }

        let data = await this.fetchData();
        let storage = this.core.storage;
        let latestPost = storage['time'];

        if(data == null) {
            console.log("Data in insta module is null!");
            return;
        }
        
        data = data['data']['user']['edge_owner_to_timeline_media']['edges'];
        let size = Object.keys(data).length;
        for(let i = 0; i < size; i++) {

          //Check if pinned
          if(Object.keys(data[i]['node']['pinned_for_users']) > 0)
            continue;

          //Latest post
          data = data[i]['node'];
          break;
        }
        if(data['taken_at_timestamp'] > latestPost) {
          const embed = this.core.createEmbedBuilder();
          embed.setColor(0xA020F0);
          embed.setTitle("Lorenne just posted something new on Instagram!");
          embed.setURL("https://www.instagram.com/p/" + data['shortcode']);
          embed.setDescription(data['edge_media_to_caption']['edges'][0]['node']['text']);
          embed.setImage(data['display_url']);
          this.core.sendAsWebHook(webhookID, embed);
          storage['time'] = data['taken_at_timestamp'];
        }
        this.timer++;
    }


    async fetchData() {
      const url = 'https://i.instagram.com/api/v1/users/web_profile_info/?username=lorenne_twitch';
    
      const headers = {
          'x-ig-app-id': '936619743392459',
          'User-Agent': 'Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': '*/*',
          'Sec-Fetch-Site': 'same-site',  // or 'cross-site' depending on your context
          'Sec-Fetch-Mode': 'cors',       // Ensure 'cors' is used for cross-origin requests
          'Sec-Fetch-Dest': 'empty',      // Set to 'empty' for API requests
      };
      
      try {
          const response = await fetch(url, {
              method: 'GET',
              headers: headers
          });
  
          // Log the status of the response instead
          console.log(`Response Status: ${response.status}`);
          if (!response.ok) {
              console.log('Network response was not ok: ' + response.statusText);
              return null;
          }
          
          const data = await response.json();
          //console.log(data); // Log the parsed JSON data
          return data;
      } catch (error) {
          console.error('There was a problem with the fetch operation:', error);
          return null;
      }
  }

}

module.exports = { Insta };