# TimeForge Agent Configuration

You can use **Claude Code** (default) or **Qwen 2.5 7B** (local inference) interchangeably.

## Model Options

### Primary: Claude Code
- Cloud-based, full reasoning depth
- Best for complex analysis, architecture decisions, debugging
- Keep this as default

### Secondary: Qwen 2.5 7B (Local)
- Open-source, local execution via ollama/vLLM
- Faster inference, lower latency
- Use for rapid iterations, code generation, quick fixes

## Behavioral Guidelines

### 1. Code Generation
- Generate idiomatic React + Vite + Supabase code
- Include inline comments for complex logic
- Test assumptions about dependencies early

### 2. Tool Usage
- Batch independent operations together
- Prefer `read_file` and `grep_search` for faster results
- Use `run_in_terminal` for verification

### 3. Response Style
- Keep answers concise (3-5 sentences for simple queries)
- Use bullet points for complex tasks
- Avoid redundant framing

## Project Context
- **Stack:** React + Vite + Supabase + GSAP
- **Design:** Weightless, glassmorphism, mobile-first, motion-first
- **Key Files:** [CLAUDE.md](CLAUDE.md), [package.json](package.json)

## Running Qwen Locally

```bash
# Using ollama (recommended)
ollama run qwen2.5:7b

# Or with vLLM
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-7B-Instruct \
  --port 8000
```

Set `OPENAI_API_BASE=http://localhost:8000` and `OPENAI_API_KEY=local-qwen` to use local inference instead of cloud APIs.
