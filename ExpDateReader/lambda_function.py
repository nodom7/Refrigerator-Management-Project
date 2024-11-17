import boto3
import json
import re

# Initialize S3 and Rekognition clients
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')

def lambda_handler(event, context):
    # Retrieve the S3 bucket name and object key from the event trigger
    bucket_name = "expdatestorage"
    object_key = event['Records'][0]['s3']['object']['key']
    
    # Step 1: Get the image from S3
    try:
        # Download the image from S3
        s3_response = s3.get_object(Bucket=bucket_name, Key=object_key)
        image_bytes = s3_response['Body'].read()
    except Exception as e:
        print(f"Error retrieving image from S3: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Error retrieving image from S3", "error": str(e)})
        }

    # Step 2: Detect barcode using Rekognition
    try:
        response = rekognition.detect_text(
            Image={'Bytes': image_bytes}
        )
        
        # Extract detected text lines that contain numbers
        detected_texts = [
            detection['DetectedText'] for detection in response['TextDetections'] 
            if detection['Type'] == 'LINE'
        ]
        
        # Print the detected texts and barcode numbers to the console for debugging
        print("Detected Texts:", detected_texts)
        
        
    except Exception as e:
        print(f"Error detecting text: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Error detecting text", "error": str(e)})
        }

