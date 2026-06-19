# ai-meridian-pipeline.ps1 - CLI Entry point wrapper
# Forwards arguments directly to the Node.js CLI script

node "$PSScriptRoot\bin\index.js" $args
