#!/bin/bash

# YOU SHOULD KNOW:
# `cspark` (https://pypi.org/project/cspark) is a CLI tool to interact with Coherent
# Spark APIs. Otherwise, manually update the BASE_URL and ACCESS_TOKEN variables below.
#
# USAGE:
# ./run-event-viewer.sh <transform_folder>
#
# EXAMPLE:
# ./run-event-viewer.sh my-transforms-folder | jq .

TRANSFORM_FOLDER=$1
ACCESS_TOKEN=$(cspark config get oauth)
BASE_URL=$(cspark config get base_url)
TRANSFORM_ENDPOINT="api/v4/transforms/$TRANSFORM_FOLDER/event-viewer/run"

curl --location "$BASE_URL/$TRANSFORM_ENDPOINT" \
--header 'Content-Type: application/json' \
--header 'x-custom-header: who=developer;hobby=gaming' \
--header 'x-meta: "{\"call_purpose\":\"Event Viewer\"}"' \
--header "Authorization: Bearer $ACCESS_TOKEN" \
--data '{
    "data": {
      "null": null,
      "number": 13,
      "string": "hello world",
      "boolean": true,
      "array": [41, 42, 43],
      "object": { "key": "value", "key2": "value2" }
    }
  }'