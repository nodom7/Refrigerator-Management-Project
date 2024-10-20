require('dotenv').config();
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS credentials using environment variables
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const uploadFile = (filePath) => {
    if (!filePath) {
        console.error('Please provide a file path.');
        return;
    }

    const fileContent = fs.readFileSync(filePath);
    const params = {
        Bucket: 'YOUR_BUCKET_NAME',
        Key: path.basename(filePath),
        Body: fileContent,
    };

    s3.upload(params, (err, data) => {
        if (err) {
            console.error('Error uploading file:', err);
            return;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
};

// Get the file path from command-line arguments
const filePath = process.argv[2];
uploadFile(filePath);
