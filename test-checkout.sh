#!/usr/bin/env bash
# Test POST to create-assessment-checkout endpoint
# Usage: bash test-checkout.sh
curl -X POST https://agenticai.net.au/api/create-assessment-checkout \
  -H "Content-Type: application/json" \
  -H "x-agenticai-webhook-secret: Az2qKCztMxLnjA56YxsqZDgzAFKWfIivpzqnlQTFD1c=" \
  -d '{"source":"test","callerName":"Test"}' \
  -v

