#!/bin/bash

# mainly because the electrum https calls seems to crash a fair amount

until go run .; do
    echo "Backend crashed with exit code $?.  Respawning.." >&2
    sleep 1
done
