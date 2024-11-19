//barcode input
const barcode = "123456789"; //temp barcode

const url = 'API url' + '{barcode}'; //Replace with url. Defines API endpoint
//const headers = {'API key'}; //Replace with API key

//Gets the API request. Uses header to pass the API key
fetch(url, { headers })
    .then(response => { //Server response
        if (!response.ok) { 
            throw new Error('Error: food information not found!')
        }
        return response.json() //Return a json because API 
    })
    .then(data => {
        console.log("Food Info: ", data); //Logs the food information
    })
    .catch(error => {
        console.log("Failed to get food information: ", error) //Failed to get food information
    })