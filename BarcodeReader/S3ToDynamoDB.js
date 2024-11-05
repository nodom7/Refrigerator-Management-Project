const AWS = require('aws-sdk');

// Initialize S3 and DynamoDB
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Define the S3 bucket and object key
const bucketName = 'S3Bucket';
const objectKey = 'ObjectKey';

// Define the DynamoDB table name
const tableName = 'DynamoDB';

async function uploadDataToDynamoDB() {
    try {
        // Fetch the file from S3
        const s3Data = await s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();
        const data = JSON.parse(s3Data.Body.toString('utf-8'));

        // Insert data into DynamoDB
        for (const item of data) {
            await dynamodb.put({ TableName: tableName, Item: item }).promise();
        }

        console.log("Data uploaded to DynamoDB.");
    } catch (error) {
        console.error("Error uploading data: ", error);
    }
}

// Run the function
uploadDataToDynamoDB();