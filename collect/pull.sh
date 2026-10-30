#!/bin/sh
# Another machine's file, fetched over ssh and laid beside this one's: the upload, by hand.
#
#   pnpm pull <ssh host> <github-username>
#
# The collector is copied to the host and run there with its own node, and what
# it prints is the file it would send. It keeps its counts on the host, as it
# would if it reported from there.
set -eu
host=$1 handle=$2
dir=$(dirname "$0")
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
ssh "$host" 'mkdir -p ~/.cache/tokendash/collect'
scp -q "$dir"/*.ts "$host":.cache/tokendash/collect/
# bash -lc: the host's own login shell may not be one that `node` is on the PATH of, or that reads 2>&1.
ssh "$host" "bash -lc 'node --no-warnings ~/.cache/tokendash/collect/index.ts count --print'" > "$tmp"
node --no-warnings "$dir/local.ts" "$handle" "$tmp"
