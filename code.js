const fetch = require('node-fetch');

async function fetchData() {
  // Define the URL you want to send the GET request to
  const url = 'https://i.instagram.com/api/v1/users/web_profile_info/?username=swedishmusicutilities';

  // Define your custom headers
  const headers = {
    'x-ig-app-id': '936619743392459',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
	'Accept-Encoding': 'gzip, deflate, br',
	'Accept': '*/*'
  };
try{
  // Send the GET request with custom headers
  const response = await fetch(url, {
    method: 'GET',
    headers: headers
  });
  
    // Check if the response is OK (status code in the range 200-299)
    if (!response.ok) {
      console.log('Network response was not ok ' + response.statusText);
	  return null;
    }
    // Parse the JSON response
    const data = await response.json();
  return data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
    return null;
  }
}

async function main() {
	
	let data = null;
	
	data = await fetchData();
	
	if(data == null)
		return;
	
	data = data['data']['user']['edge_owner_to_timeline_media']['edges'];
	//taken_at_timestamp shortcode
	console.log(data[1]['node']['taken_at_timestamp']);

}

main();