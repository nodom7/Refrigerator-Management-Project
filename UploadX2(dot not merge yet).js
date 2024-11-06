const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS resources
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const saveBarcodeData = async (barcodeId, fileName) => {
    const params = {
        TableName: 'BarcodeData',
        Item: {
            barcodeId,
            fileName,
            uploadTimestamp: new Date().toISOString(),
        },
    };

    try {
        await dynamoDB.put(params).promise();
        console.log('Metadata saved to DynamoDB');
    } catch (error) {
        console.error('Error saving to DynamoDB:', error);
    }
};

const uploadFile = async (fileContent, fileName, barcodeId) => {
    const params = {
        Bucket: 'YOUR_BUCKET_NAME',
        Key: fileName,
        Body: Buffer.from(fileContent, 'base64'), // Decode the base64 content
    };

    try {
        const s3Response = await s3.upload(params).promise();
        console.log(`File uploaded successfully. ${s3Response.Location}`);
        
        // Save file metadata to DynamoDB
        await saveBarcodeData(barcodeId, fileName);
    } catch (err) {
        console.error('Error uploading file:', err);
    }
};

exports.handler = async (event) => {
    const { barcodeId, fileContent, fileName } = JSON.parse(event.body);

    try {
        await uploadFile(fileContent, fileName, barcodeId);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'File uploaded and metadata saved.' }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error processing barcode upload.' }),
        };
    }
};
