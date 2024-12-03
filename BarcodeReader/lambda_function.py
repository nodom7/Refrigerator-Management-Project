import boto3
import json
import urllib.request

# Initialize S3 and Rekognition clients
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')

# Food information API endpoint
api_url = "https://world.openfoodfacts.org/api/v0/product/"

def get_food_info(barcode):
    try:
        url = f"{api_url}{barcode}.json"
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get("status") == 1:
                product = data.get("product", {})
                return {
                    "name": product.get("product_name", "Unknown"),
                    "brand": product.get("brands", "Unknown"),
                    "ingredients": product.get("ingredients_text", "Unknown"),
                    "allergens": product.get("allergens", "None"),
                    "nutrients": product.get("nutriments", {})
                }
            return {"error": "Product not found in database"}
    except Exception as e:
        return {"error": f"Failed to fetch data: {str(e)}"}

def lambda_handler(event, context):
    bucket_name = "barcodestorage"
    object_key = event['Records'][0]['s3']['object']['key']

    try:
        # Get the image from S3
        s3_response = s3.get_object(Bucket=bucket_name, Key=object_key)
        image_bytes = s3_response['Body'].read()
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": f"Error retrieving image: {str(e)}"})}

    try:
        # Detect text in the image
        rekognition_response = rekognition.detect_text(Image={'Bytes': image_bytes})
        detected_texts = [detection['DetectedText'] for detection in rekognition_response['TextDetections'] if detection['Type'] == 'LINE']
        
        # Process detected texts to form a valid barcode
        barcode = ''.join([text.replace(' ', '') for text in detected_texts if text.replace(' ', '').isdigit()])
        
        if barcode:
            # Fetch food info and print it
            food_info = get_food_info(barcode)
            print("Food Information:", json.dumps(food_info, indent=2))  # Print food information
            return {"statusCode": 200, "body": json.dumps(food_info)}
        else:
            return {"statusCode": 400, "body": json.dumps({"error": "No valid barcode found in image"})}
    
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": f"Error detecting text: {str(e)}"})}
