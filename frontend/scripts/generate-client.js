import { createClient, defaultPlugins } from '@hey-api/openapi-ts';


async function generateClient() {
  try {
    await createClient({
      input: 'http://localhost:8000/openapi.json',
      output: './src/api',
      plugins: [
        ...defaultPlugins,
        '@hey-api/client-fetch',
      ]
    });
    console.log('✅ API client generated successfully!');
  } catch (error) {
    console.error('❌ Error generating client:', error);
    process.exit(1);
  }
}

// Run the generation
generateClient();
