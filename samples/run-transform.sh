#!/bin/bash

# Before running this script, make sure to update the parameters below as you see fit:
# - access token
# - base URL
# - transform endpoint
# - transform folder
# - transform name
# - service URI
# - debugger
#
# USAGE:
# ./run-transform.sh
#
# EXAMPLE:
# ./run-transform.sh > response.json

ACCESS_TOKEN="some-access-token"
BASE_URL="https://excel.my-env.coherent.global/my-tenant"
TRANSFORM_ENDPOINT="api/v4/transforms/my-folder/my-transform-name/run"

curl --location "$BASE_URL/$TRANSFORM_ENDPOINT" \
  --header 'Content-Type: application/json' \
  --header 'x-meta: "{\"call_purpose\":\"Debugging\",\"service_uri\":\"my-folder/my-service\",\"debugger\":false}"' \
  --header "Authorization: Bearer $ACCESS_TOKEN" \
  --data '{"radius_field": 3.4, "height_field": 4.5}'