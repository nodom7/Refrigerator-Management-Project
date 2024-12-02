import boto3
import json
import requests

# Initialize S3 and Rekognition clients
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')

# Food information API endpoint
api_url = "https://world.openfoodfacts.org/api/v0/product/"

def get_food_info(barcode):
    try:
        response = requests.get(f"{api_url}{barcode}.json")
        data = response.json()
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
        s3_response = s3.get_object(Bucket=bucket_name, Key=object_key)
        image_bytes = s3_response['Body'].read()
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": f"Error retrieving image: {str(e)}"})}

    try:
        rekognition_response = rekognition.detect_text(Image={'Bytes': image_bytes})
        detected_texts = [detection['DetectedText'] for detection in rekognition_response['TextDetections'] if detection['Type'] == 'LINE']
        
        barcode = None
        for text in detected_texts:
            if text.isdigit():  # Assuming the barcode is numeric
                barcode = text
                break
        
        if barcode:
            food_info = get_food_info(barcode)
            return {"statusCode": 200, "body": json.dumps(food_info)}
        else:
            return {"statusCode": 400, "body": json.dumps({"error": "No barcode found in image"})}
    
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": f"Error detecting text: {str(e)}"})}
