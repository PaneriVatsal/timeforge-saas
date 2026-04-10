$env:ANTHROPIC_BASE_URL = "http://localhost:11434"
if (-not $env:ANTHROPIC_API_KEY) {
    $env:ANTHROPIC_API_KEY = "local-dev-ollama"
}
$env:ANTHROPIC_DEFAULT_MODEL = "qwen2.5-coder:7b"

Write-Host "Forcing Claude Code to local Ollama (Qwen 2.5 Coder 7B)..." -ForegroundColor Green
claude
