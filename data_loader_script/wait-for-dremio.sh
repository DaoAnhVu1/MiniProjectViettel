#!/bin/sh

# Wait for Dremio to be available
while ! curl -s http://dremio:9047; do
  echo "Waiting for Dremio to be ready..."
  sleep 10
done

echo "Dremio is up and running!"
exec "$@"
