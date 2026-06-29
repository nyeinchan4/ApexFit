#!/bin/sh
set -e

: "${API_GATEWAY_HOST:=apexfit-backend-api-gateway}"

envsubst '${API_GATEWAY_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
