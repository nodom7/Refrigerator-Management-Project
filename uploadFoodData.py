import boto3
import json
import urllib.request
import re
from datetime import datetime

s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')
dynamodb = boto3.resource('dynamodb')

#Dynamo db
table = dynamodb.Table('FoodDataTable')

# Food information API endpoint
api_url = "https://world.openfoodfacts.org/api/v0/product/"

def get_food_info(barcode):
    """Fetches food product details from the Open Food Facts API"""
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
                    "nutrients": product.get("nutriments", {}),
                }
            return {"error": "Product not found in database"}
    except Exception as e:
        return {"error": f"Failed to fetch data: {str(e)}"}

def extract_expiration_date(text_lines):
    """Extract expiration date from the detected text lines."""
    # Define date patterns
    date_patterns = [
        r'\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12][0-9]|3[01])[/-](\d{2,4})\b',             # MM/DD/YYYY
        r'\b(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[0-2])[/-](\d{2,4})\b',             # DD/MM/YYYY
        r'\b(\d{2,4})[/-](0?[1-9]|1[0-2])[/-](0?[1-9]|[12][0-9]|3[01])\b',             # YYYY/MM/DD
        r'\b(?:EXP|EXPIRY|EXPIRES)[: ]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',             # EXP: MM/DD/YY
        r'\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[ ]?\d{1,2}\d{2,4}\b',    # JUN1814
        r'\b\d{1,2}[ ]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[ ]?\d{2,4}\b' # 18 JUN 14
    ]
    
    # Search for matching patterns in the text lines
    for pattern in date_patterns:
        for line in text_lines:
            match = re.search(pattern, line)
            if match:
                return match.group(0)  # Return the first matched expiration date
    
    return None  # Return None if no date pattern is found

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
        # Detect text in the image using Rekognition
        rekognition_response = rekognition.detect_text(Image={'Bytes': image_bytes})
        detected_texts = [detection['DetectedText'] for detection in rekognition_response['TextDetections'] if detection['Type'] == 'LINE']
        
        # Process detected texts to form a valid barcode
        barcode = ''.join([text.replace(' ', '') for text in detected_texts if text.replace(' ', '').isdigit()])
        
        # Extract expiration date from detected text
        exp_date = extract_expiration_date(detected_texts)

        if barcode and exp_date:
            # Fetch food info from the Open Food Facts API
            food_info = get_food_info(barcode)

            # Prepare data to store in DynamoDB
            food_data = {
                'barcode': barcode,
                'exp_date': exp_date,
                'food_name': food_info.get("name", "Unknown"),
                'food_brand': food_info.get("brand", "Unknown"),
                'ingredients': food_info.get("ingredients", "Unknown"),
                'allergens': food_info.get("allergens", "None"),
                'nutrients': food_info.get("nutrients", {}),
                'uploaded_at': str(datetime.now())
            }

            # Save food data to DynamoDB
            table.put_item(Item=food_data)

            # Return success response
            return {"statusCode": 200, "body": json.dumps(food_data)}
        else:
            return {"statusCode": 400, "body": json.dumps({"error": "No valid barcode or expiration date found in image"})}
    
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": f"Error processing image: {str(e)}"})}
