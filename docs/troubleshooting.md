# Troubleshooting

## Backend won't start

**Symptom:** `uv run uitars-mcp --serve` fails with import error.

**Fix:**
```powershell
uv sync --extra dev
uv run uitars-mcp --serve
```

## Port already in use

**Symptom:** `OSError: [Errno 10048]` or port conflict.

**Fix:**
```powershell
Get-NetTCPConnection -LocalPort 10976 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
.\web_sota\start.ps1
```

The `start.ps1` script does this automatically.

## VLM not responding

**Symptom:** Tasks immediately fail or timeout.

**Check VLM health:**
```
GET http://127.0.0.1:10976/api/status
```

**Fix for Ollama:**
```powershell
ollama list          # is qwen2.5-vl:7b installed?
ollama serve         # is it running?
ollama pull qwen2.5-vl:7b   # install if missing
```

**Fix for vLLM:**
```powershell
# Check vLLM is running
curl http://127.0.0.1:8000/v1/models
```

## pyautogui fails on Windows

**Symptom:** `pyautogui` import errors or `FailSafeException`.

**Fix:**
```powershell
pip install pyautogui --force-reinstall
```

Windows may need `pywin32`:
```powershell
uv add pywin32
```

## Screenshots are black

**Symptom:** Screenshot returns all-black image.

This can happen with `mss` on some GPU/driver configurations. Try:
```powershell
# Switch to Pillow-based screenshot as fallback
# (requires code change — file an issue if you hit this)
```

## Webapp shows "Backend: DOWN"

**Symptom:** Frontend loads but backend badge is red.

**Fix:** Backend isn't running or port mismatch:
```powershell
uv run uitars-mcp --serve --port 10976
```
Check `vite.config.ts` proxy target matches the backend port.

## VLM returns gibberish action

**Symptom:** Task runs but actions are `unknown` or nonsensical.

**Root cause:** Some VLMs (especially smaller ones) don't follow the UI-TARS action format well.

**Fix:**
- Use `qwen2.5-vl:7b` or larger — these understand spatial instructions
- Use a cloud model (Claude, GPT-4o) for complex tasks
- UI-TARS-1.5-7B specifically trained for this format — use it via vLLM for best results

## Task runs forever

**Symptom:** Task doesn't stop — keeps clicking around.

**Fix:**
- Move mouse to corner (0,0) — triggers failsafe abort
- Set lower `UITARS_MAX_STEPS` (e.g., `5`)
- Pass `max_steps=5` in the tool call
- Check if the VLM is failing to output `finished()` — model quality issue
