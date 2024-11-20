const axios = require('axios');

// Function to get food information by barcode
async function getFoodInfo(barcode) {
    const apiUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

    try {
        const response = await axios.get(apiUrl);

        // Check if product data is returned successfully
        if (response.data && response.data.status === 1) {
            const product = response.data.product;
            return {
                name: product.product_name || 'Unknown',
                brand: product.brands || 'Unknown',
                ingredients: product.ingredients_text || 'Unknown',
                allergens: product.allergens || 'None',
                nutrients: product.nutriments || {}
            };
        } else {
            // Product not found in the database
            return { error: 'Product not found in the database' };
        }
    } catch (error) {
        // Catch any error from the API call
        console.error('Error fetching product data:', error.message);
        return { error: 'Failed to fetch data from API' };
    }
}

// Simulate barcode scanning for testing
async function simulateBarcodeScan() {
    const scannedBarcode = '737628064502'; // Example barcode (Coca-Cola)
    
    try {
        const foodInfo = await getFoodInfo(scannedBarcode);

        if (foodInfo.error) {
            console.log(foodInfo.error);
        } else {
            console.log('Food Information:', foodInfo);
        }
    } catch (err) {
        console.error('Error in barcode scan simulation:', err.message);
    }
}

simulateBarcodeScan();
