import json
import boto3

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
fridge_table = dynamodb.Table('FridgeInventory')

def lambda_handler(event, context):
    #Searches for all items in Fridge table
    response = fridge_table.scan()
    items = response['Items']
    
    
    try:
        # Query for an ingredient in the FridgeInventory table and store it in results.
        query_results = []
        for ingredients in ingredients_list:
            query_response = fridge_table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key('ingredient').eq(ingredient_to_query)
        )
        query_results.append(query_response['Items']) 
        
        # Handle items found in the query
        if items:
            print("Found ingredients:", items)
        else:
            print(f"No items found for {ingredient_to_query}")
    #Catches exceptions during query
    except Exception as e:
            print(f"Error querying FridgeInventory table: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error querying FridgeInventory table: {str(e)}")
        }
    #successful
    return {
        'statusCode': 200,
        'body': json.dumps({'items': items})
    }
