#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "=============================================================================="
echo "  Exporting Conveyor Digital Twin to a Standalone Shareable Image (.tar)"
echo "=============================================================================="

echo "Saving Docker image 'conveyor-digital-twin:latest' to conveyor-digital-twin.tar..."
docker save -o conveyor-digital-twin.tar conveyor-digital-twin:latest

echo "=============================================================================="
echo "  SUCCESS! File exported: conveyor-digital-twin.tar"
echo "  You can share this single file with anyone."
echo ""
echo "  To run it on any other computer:"
echo "    1. docker load -i conveyor-digital-twin.tar"
echo "    2. docker run -d -p 8000:8000 conveyor-digital-twin:latest"
echo "    3. Open browser at: http://localhost:8000"
echo "=============================================================================="
