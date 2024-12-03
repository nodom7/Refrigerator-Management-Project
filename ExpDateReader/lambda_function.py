import boto3
import json
import re
from datetime import datetime

# Initialize S3 and Rekognition clients
s3 = boto3.client('s3')
rekognition = boto3.client('rekognition')

def lambda_handler(event, context):
    bucket_name = "expdatestorage"
    object_key = event['Records'][0]['s3']['object']['key']

    # Get the image from S3
    try:
        image_bytes = s3.get_object(Bucket=bucket_name, Key=object_key)['Body'].read()
    except Exception as e:
        print(f"Error retrieving image from S3: {e}")
        return {"statusCode": 500, "body": json.dumps({"message": "Error retrieving image from S3", "error": str(e)})}

    # Detect text using Rekognition
    try:
        response = rekognition.detect_text(Image={'Bytes': image_bytes})
        detected_texts = [d['DetectedText'] for d in response['TextDetections'] if d['Type'] == 'LINE']
        print("Detected Texts:", detected_texts)
    except Exception as e:
        print(f"Error detecting text: {e}")
        return {"statusCode": 500, "body": json.dumps({"message": "Error detecting text", "error": str(e)})}

    # Extract expiration dates from detected texts
    try:
        expiration_date = extract_expiration_date(detected_texts)
        if expiration_date:
            print(f"Expiration Date Found: {expiration_date}")
            return {"statusCode": 200, "body": json.dumps({"expiration_date": expiration_date})}
        else:
            print("No expiration date found.")
            return {"statusCode": 404, "body": json.dumps({"message": "No expiration date found in image."})}
    except Exception as e:
        print(f"Error extracting expiration date: {e}")
        return {"statusCode": 500, "body": json.dumps({"message": "Error extracting expiration date", "error": str(e)})}

def extract_expiration_date(text_lines):
    # Define date patterns
    date_patterns = [
        r'\b(0?[1-9]|1[0-2])[/-](0?[1-9]|[12][0-9]|3[01])[/-](\d{2,4})\b',             # MM/DD/YYYY
        r'\b(0?[1-9]|[12][0-9]|3[01])[/-](0?[1-9]|1[0-2])[/-](\d{2,4})\b',             # DD/MM/YYYY
        r'\b(\d{2,4})[/-](0?[1-9]|1[0-2])[/-](0?[1-9]|[12][0-9]|3[01])\b',             # YYYY/MM/DD
        r'\b(?:EXP|EXPIRY|EXPIRES)[: ]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b',             # EXP: MM/DD/YY
        r'\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[ ]?\d{1,2}\d{2,4}\b',    # JUN1814
        r'\b\d{1,2}[ ]?(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[ ]?\d{2,4}\b' # 18 JUN 14
    ]

    # Compile regex patterns once for efficiency
    regex_patterns = [re.compile(p, re.IGNORECASE) for p in date_patterns]

    for line in text_lines:
        for pattern in regex_patterns:
            match = pattern.search(line)
            if match:
                date_str = match.group()
                parsed_date = parse_date(date_str)
                if parsed_date:
                    return parsed_date
    return None

def parse_date(date_str):
    date_formats = [
        "%m/%d/%Y", "%m/%d/%y", "%d/%m/%Y", "%d/%m/%y",
        "%Y/%m/%d", "%y/%m/%d", "%b%d%Y", "%b%d%y",
        "%b %d %Y", "%b %d %y", "%d%b%Y", "%d%b%y",
        "%d %b %Y", "%d %b %y"
    ]
    for fmt in date_formats:
        try:
            parsed_date = datetime.strptime(date_str.upper(), fmt)
            return parsed_date.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None

