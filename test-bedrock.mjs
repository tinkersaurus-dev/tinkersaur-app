/**
 * Direct test of AWS Bedrock API using SDK (matching app implementation)
 */
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

const AWS_REGION = 'us-east-1';
const BEDROCK_MODEL_ID = 'qwen.qwen3-coder-30b-a3b-v1:0';
const AWS_BEARER_TOKEN_BEDROCK = 'ABSKQmVkcm9ja0FQSUtleS1lbWRpLWF0LTg3NTM3NjIyOTIyMzppRHgxWW5RSDBSN01mQ3VvUm5nTE1ZT212TVcyK3RvZ3FudklYNmsrNzgxbGNkT2NhNUhweXlvcGF3cz0=';

console.log('=== AWS Bedrock Direct Test (SDK - matching app) ===');
console.log('Region:', AWS_REGION);
console.log('Model ID:', BEDROCK_MODEL_ID);
console.log('Bearer token exists:', !!AWS_BEARER_TOKEN_BEDROCK);
console.log('Bearer token length:', AWS_BEARER_TOKEN_BEDROCK?.length);

// Create credentials object directly - matching app implementation
const credentials = AWS_BEARER_TOKEN_BEDROCK
  ? {
      accessKeyId: '',
      secretAccessKey: '',
      sessionToken: AWS_BEARER_TOKEN_BEDROCK,
    }
  : {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    };

const client = new BedrockRuntimeClient({
  region: AWS_REGION,
  credentials,
});

console.log('\n=== Preparing Request ===');

const bedrockRequest = {
  messages: [
    {
      role: 'system',
      content: 'You are a helpful assistant that generates mermaid diagrams.',
    },
    {
      role: 'user',
      content: 'Generate a simple BPMN flowchart for: user login process',
    },
  ],
  max_tokens: 1024,
  temperature: 0.7,
  top_p: 0.9,
};

console.log('Bedrock request prepared, model:', BEDROCK_MODEL_ID);
console.log('Region:', AWS_REGION);
console.log('Using bearer token:', !!AWS_BEARER_TOKEN_BEDROCK);

const command = new InvokeModelCommand({
  modelId: BEDROCK_MODEL_ID,
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify(bedrockRequest),
});

console.log('\n=== Sending Request to Bedrock ===');
console.log('Timestamp:', new Date().toISOString());

try {
  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Bedrock request timed out after 120 seconds'));
    }, 120000);
  });

  console.log('Calling client.send(command)...');
  const startTime = Date.now();

  // Race between the actual request and the timeout
  const response = await Promise.race([
    client.send(command),
    timeoutPromise
  ]);

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log('\n=== ✅ RESPONSE RECEIVED ===');
  console.log('Duration:', duration, 'ms');
  console.log('Response metadata:', response.$metadata);
  console.log('Response status code:', response.$metadata?.httpStatusCode);
  console.log('Request ID:', response.$metadata?.requestId);

  // Parse the response body
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  console.log('\n=== Response Body Structure ===');
  console.log('Keys:', Object.keys(responseBody));
  console.log('Full response body:', JSON.stringify(responseBody, null, 2));

  // Extract generated content
  const generatedContent =
    responseBody.choices?.[0]?.message?.content ||
    responseBody.content?.[0]?.text ||
    responseBody.output?.text ||
    responseBody.text ||
    '';

  console.log('\n=== Generated Content ===');
  console.log(generatedContent);

  console.log('\n=== ✅ TEST SUCCESSFUL ===');
  process.exit(0);

} catch (error) {
  console.error('\n=== ❌ ERROR OCCURRED ===');
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);

  if (error.$metadata) {
    console.error('Error metadata:', error.$metadata);
  }

  console.log('\n=== ❌ TEST FAILED ===');
  process.exit(1);
}
