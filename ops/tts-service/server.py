#!/usr/bin/env python3
"""
NurEine lokaler TTS-Service — HTTP-API im Heimnetz.

Läuft auf dem Mac Mini (mac-mini-server, 192.168.178.3:8123) und erzeugt
Sprachaufnahmen lokal, ohne Cloud-Kosten. Jeder Agent und die Reel-Pipeline
rufen ihn wie einen Cloud-Dienst per HTTP auf.

ENGINES
  piper       — ONNX, sehr schnell auf CPU (RTF ~0.3 = 3x schneller als Echtzeit),
                deutsche Stimme "thorsten". Standard-Engine, immer verfügbar.
  chatterbox  — Chatterbox Multilingual (Resemble AI), 0.5B-Transformer.
                Bessere Prosodie + Voice-Cloning, aber deutlich langsamer auf
                dieser CPU (kein AVX2). Nur nutzen, wenn Zeit egal ist.

ENDPOINTS
  GET  /health          → {"ok":true, "engines":[...]}
  GET  /voices          → verfügbare Stimmen je Engine
  POST /tts             → Audio erzeugen (JSON, s.u.)
  POST /v1/audio/speech → OpenAI-kompatibler Alias (für Tools, die das Format sprechen)

POST /tts  Body:
  {
    "text":   "Der zu sprechende Text",        # Pflicht
    "engine": "piper" | "chatterbox",          # Default: piper
    "voice":  "de_DE-thorsten-medium",         # Default: erste dt. Stimme
    "format": "wav" | "mp3",                   # Default: mp3
    "speed":  1.0,                             # 0.5–2.0, Default 1.0
    "words":  false                            # true → zusätzlich Wort-Timings (nur piper)
  }
Antwort: Audio-Bytes (audio/mpeg bzw. audio/wav).
Mit "words": true → JSON {"audio_base64": "...", "words": [{"t":"Wort","s":0.12,"e":0.4}]}

Start:  ~/tts-service/.venv/bin/python server.py
Systemd: siehe ops/tts-service/nureine-tts.service
"""
from __future__ import annotations

import base64
import io
import json
import os
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

# ── Konfiguration ───────────────────────────────────────────────────────────
SERVICE_DIR = Path(os.environ.get("TTS_SERVICE_DIR", Path.home() / "tts-service"))
MODELS_DIR = SERVICE_DIR / "models"
VENV_PY = SERVICE_DIR / ".venv" / "bin" / "python"
DEFAULT_PIPER_VOICE = os.environ.get("TTS_PIPER_VOICE", "de_DE-thorsten-medium")

app = FastAPI(title="NurEine TTS", version="1.0")

# Chatterbox wird faul geladen (Modell ~2 GB, dauert beim ersten Mal).
_chatterbox_model: Any = None


def piper_voices() -> list[str]:
    """Alle installierten Piper-Stimmen (je .onnx-Datei eine)."""
    if not MODELS_DIR.exists():
        return []
    return sorted(p.stem for p in MODELS_DIR.glob("*.onnx"))


def chatterbox_available() -> bool:
    try:
        import chatterbox  # noqa: F401
        return True
    except Exception:
        return False


def to_mp3(wav_path: Path) -> bytes:
    """WAV → MP3 (ffmpeg). Die Pipeline erwartet MP3."""
    out = wav_path.with_suffix(".mp3")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path),
         "-codec:a", "libmp3lame", "-q:a", "2", str(out)],
        check=True,
    )
    return out.read_bytes()


def apply_speed(wav_path: Path, speed: float) -> Path:
    """Tempo ändern ohne Tonhöhenverschiebung (ffmpeg atempo)."""
    if abs(speed - 1.0) < 0.01:
        return wav_path
    speed = max(0.5, min(2.0, speed))
    out = wav_path.with_name(wav_path.stem + "-sp.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path),
         "-filter:a", f"atempo={speed:.3f}", str(out)],
        check=True,
    )
    return out


# ── Engines ─────────────────────────────────────────────────────────────────
def voice_speakers(voice: str) -> dict[str, int]:
    """Mehrsprecher-Modelle (z.B. thorsten_emotional) haben benannte Stimmen/Emotionen."""
    cfg = MODELS_DIR / f"{voice}.onnx.json"
    if not cfg.exists():
        return {}
    try:
        return json.loads(cfg.read_text()).get("speaker_id_map", {}) or {}
    except Exception:
        return {}


def synth_piper(text: str, voice: str, out_wav: Path, want_words: bool,
                emotion: str | None = None) -> list[dict] | None:
    """Piper: schnell, CPU-freundlich. Optional mit Wort-Timings.

    `emotion` wählt bei Mehrsprecher-Modellen (thorsten_emotional) die Variante:
    amused, angry, disgusted, drunk, neutral, sleepy, surprised, whisper.
    Für NurEine ist "amused" der warme, zugewandte Ton — "neutral" klingt
    schnell nach unbeteiligtem Vorlesen."""
    model = MODELS_DIR / f"{voice}.onnx"
    if not model.exists():
        raise HTTPException(404, f"Piper-Stimme '{voice}' nicht gefunden. Verfügbar: {piper_voices()}")

    cmd = [str(VENV_PY), "-m", "piper", "-m", str(model), "-f", str(out_wav)]

    speakers = voice_speakers(voice)
    if emotion and speakers:
        if emotion not in speakers:
            raise HTTPException(400, f"Emotion '{emotion}' gibt es bei '{voice}' nicht. Möglich: {sorted(speakers)}")
        cmd += ["--speaker", str(speakers[emotion])]

    proc = subprocess.run(cmd, input=text.encode("utf-8"), capture_output=True)
    if proc.returncode != 0 or not out_wav.exists():
        raise HTTPException(500, f"Piper-Fehler: {proc.stderr.decode()[:400]}")

    if not want_words:
        return None
    # Näherung: Wort-Timings proportional zur Zeichenlänge über die Audiodauer.
    # (Piper liefert keine nativen WordBoundaries wie edge-tts.)
    with wave.open(str(out_wav)) as w:
        dur = w.getnframes() / float(w.getframerate())
    tokens = [t for t in text.split() if t.strip()]
    total = sum(len(t) for t in tokens) or 1
    words, cursor = [], 0.0
    for t in tokens:
        share = len(t) / total * dur
        words.append({"t": t, "s": round(cursor, 3), "e": round(cursor + share, 3)})
        cursor += share
    return words


def synth_chatterbox(text: str, out_wav: Path, speed: float) -> None:
    """Chatterbox Multilingual — bessere Prosodie, deutlich langsamer auf CPU."""
    global _chatterbox_model
    try:
        import torch
        import torchaudio
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
    except Exception as exc:
        raise HTTPException(503, f"Chatterbox nicht verfügbar: {exc}")

    if _chatterbox_model is None:
        _chatterbox_model = ChatterboxMultilingualTTS.from_pretrained(device="cpu")

    wav = _chatterbox_model.generate(text, language_id="de")
    torchaudio.save(str(out_wav), wav, _chatterbox_model.sr)


# ── API ─────────────────────────────────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)
    engine: str = "piper"
    voice: str | None = None
    emotion: str | None = None   # nur thorsten_emotional: amused, surprised, whisper, …
    format: str = "mp3"
    speed: float = 1.0
    words: bool = False


@app.get("/health")
def health() -> dict:
    engines = ["piper"] if piper_voices() else []
    if chatterbox_available():
        engines.append("chatterbox")
    return {"ok": True, "engines": engines, "piper_voices": piper_voices()}


@app.get("/voices")
def voices() -> dict:
    piper = {}
    for v in piper_voices():
        speakers = voice_speakers(v)
        piper[v] = {"emotions": sorted(speakers)} if speakers else {}
    return {
        "piper": piper,
        "chatterbox": ["multilingual (de)"] if chatterbox_available() else [],
    }


@app.post("/tts")
def tts(req: TTSRequest):
    engine = req.engine.lower()
    with tempfile.TemporaryDirectory() as td:
        wav = Path(td) / "out.wav"

        if engine == "piper":
            word_list = synth_piper(req.text, req.voice or DEFAULT_PIPER_VOICE, wav,
                                    req.words, req.emotion)
        elif engine == "chatterbox":
            synth_chatterbox(req.text, wav, req.speed)
            word_list = None
        else:
            raise HTTPException(400, f"Unbekannte Engine '{req.engine}' (piper|chatterbox)")

        final = apply_speed(wav, req.speed)

        if req.format == "wav":
            audio, mime = final.read_bytes(), "audio/wav"
        else:
            audio, mime = to_mp3(final), "audio/mpeg"

        if req.words and word_list is not None:
            return JSONResponse({
                "audio_base64": base64.b64encode(audio).decode(),
                "mime": mime,
                "words": word_list,
            })
        return Response(content=audio, media_type=mime)


class OpenAISpeech(BaseModel):
    """OpenAI-kompatibler Body (/v1/audio/speech)."""
    input: str
    model: str = "piper"
    voice: str | None = None
    response_format: str = "mp3"
    speed: float = 1.0


@app.post("/v1/audio/speech")
def openai_speech(req: OpenAISpeech):
    engine = "chatterbox" if "chatterbox" in req.model.lower() else "piper"
    return tts(TTSRequest(
        text=req.input, engine=engine, voice=req.voice,
        format=req.response_format, speed=req.speed,
    ))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("TTS_PORT", 8123)))
