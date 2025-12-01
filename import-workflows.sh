#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -E '^N8N_API_KEY=' .env | xargs)
fi

N8N_API_KEY="${N8N_API_KEY:-}"
N8N_URL="http://localhost:5678/api/v1"

if [ -z "$N8N_API_KEY" ]; then
  echo "❌ Error: N8N_API_KEY is not set. Please set it in .env file or as environment variable."
  exit 1
fi

for file in n8n-workflows/*.json; do
  echo "Importing: $(basename $file)"
  
  # Extract only required fields for N8N API
  WORKFLOW=$(cat "$file" | jq '{name, nodes, connections, settings}')
  
  RESULT=$(echo "$WORKFLOW" | curl -s -X POST "$N8N_URL/workflows" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d @-)
  
  # Check result
  ID=$(echo "$RESULT" | jq -r '.id // empty')
  if [ -n "$ID" ]; then
    NAME=$(echo "$RESULT" | jq -r '.name')
    echo "✅ Created: $NAME (ID: $ID)"
  else
    ERROR=$(echo "$RESULT" | jq -r '.message // "Unknown error"')
    echo "❌ Error: $ERROR"
  fi
  echo ""
done
