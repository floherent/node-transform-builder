#!/bin/bash

# YOU SHOULD KNOW:
# `cspark` (https://pypi.org/project/cspark) is a CLI tool to interact with Coherent
# Spark APIs. Otherwise, manually update the BASE_URL and ACCESS_TOKEN variables below.
#
# USAGE:
# ./run-hello-world.sh <transform_folder>
#
# EXAMPLE:
# ./run-hello-world.sh my-transforms-folder

TRANSFORM_FOLDER=$1
ACCESS_TOKEN=$(cspark config get oauth)
BASE_URL=$(cspark config get base_url)
TRANSFORM_ENDPOINT="api/v4/transforms/$TRANSFORM_FOLDER/hello-world/run"

echo "POST $BASE_URL/$TRANSFORM_ENDPOINT"

curl --location "$BASE_URL/$TRANSFORM_ENDPOINT" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $ACCESS_TOKEN" \
--data ''

echo