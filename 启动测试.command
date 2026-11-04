#!/bin/bash
cd "$(dirname "$0")"
export IRC_DEMO=1
export IRC_DATA_DIR="$PWD/test-data"
open http://127.0.0.1:8765
python3 server.py
