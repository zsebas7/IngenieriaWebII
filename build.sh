#!/usr/bin/env bash
set -e

# Railway/Railpack build entrypoint
npm install --workspaces --include-workspace-root=false
npm run build
