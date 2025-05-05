// index.mjs
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { QBusinessClient, ChatSyncCommand } from "@aws-sdk/client-qbusiness";
import { v4 as uuid } from "uuid";

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });
const q = new QBusinessClient({ region: process.env.AWS_REGION });

export const handler = async () => {
  // 1) Compute cutoff 3 days out
  const cutoff = new Date(Date.now() + 3*24*60*60e3).toISOString();

  // 2) Scan FoodItems for items expiring by cutoff
  const { Items } = await dynamo.send(new ScanCommand({
    TableName: process.env.FOOD_TABLE,            // "FoodItems"
    FilterExpression:    "expirationDate <= :c",
    ExpressionAttributeValues: {
      ":c": { S: cutoff }
    },
    ProjectionExpression: "foodId, barcodeData, expirationDate"
  }));

  if (!Items?.length) {
    console.log("No soon-to-expire items found.");
    return;
  }

  // 3) Extract names
  const list = Items
    .map(i => {
      // barcodeData.barcode.name -> string
      const name = i.barcodeData.M.barcode.M.name.S;
      const exp  = i.expirationDate.S;
      return `• ${name} (expires ${exp})`;
    })
    .join("\n");

  // 4) Build prompt
  const prompt = [
    "I have these ingredients about to expire soon:",
    list,
    "",
    "Please suggest 3 recipes using them."
  ].join("\n");

  // 5) Call Q Business ChatSync
  const resp = await q.send(new ChatSyncCommand({
    applicationId: process.env.Q_APP_ID,          // your Q app id
    clientToken:    uuid(),
    userMessage:    prompt
  }));
  const suggestion = resp.messages?.[0]?.content ?? "No recipes returned.";

  // 6) Print to CloudWatch
  console.log("Recipe suggestions:\n", suggestion);
};
