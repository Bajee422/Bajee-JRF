"""
BAJEE JRF AI
Local YouTube Audio Transcription Helper

Purpose:
    Transcribe a locally downloaded YouTube audio/video file
    using faster-whisper.

Zero-cost/local design:
    - No paid API
    - No cloud transcription API
    - Uses local faster-whisper
    - Outputs JSON to stdout
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def configure_windows_output() -> None:
    """
    Make stdout/stderr safe for Unicode on Windows.

    The Node backend captures this helper's output. Windows may expose
    stdout/stderr as cp1252, which cannot encode some perfectly valid
    Unicode characters returned by Whisper (for example smart quotes,
    em dashes, or non-Latin characters).

    UTF-8 keeps the transcript intact while backslash replacement prevents
    diagnostic output from crashing the process if an unusual character
    reaches the console stream.
    """
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(
                encoding="utf-8",
                errors="backslashreplace"
            )
        except (AttributeError, OSError):
            # Older Python/runtime streams may not support reconfigure.
            pass


def emit(payload: dict) -> None:
    """
    Write exactly one JSON result to stdout.

    ensure_ascii=True is intentional here. JSON escapes Unicode characters
    using ASCII sequences, so Windows cp1252 cannot break the JSON transport.
    The Node backend JSON.parse() restores the original Unicode characters.
    """
    print(
        json.dumps(
            payload,
            ensure_ascii=True
        )
    )


def main() -> int:
    configure_windows_output()

    parser = argparse.ArgumentParser(
        description=(
            "BAJEE JRF AI local YouTube transcription helper"
        )
    )

    parser.add_argument(
        "audio_path",
        help="Path to the downloaded YouTube audio/video file"
    )

    parser.add_argument(
        "--model",
        default=os.environ.get(
            "WHISPER_MODEL",
            "small"
        ),
        help="Whisper model name. Default: small"
    )

    parser.add_argument(
        "--device",
        default=os.environ.get(
            "WHISPER_DEVICE",
            "cpu"
        ),
        help="Whisper device. Default: cpu"
    )

    parser.add_argument(
        "--compute-type",
        default=os.environ.get(
            "WHISPER_COMPUTE_TYPE",
            "int8"
        ),
        help="Whisper compute type. Default: int8"
    )

    args = parser.parse_args()

    audio_path = Path(
        args.audio_path
    ).expanduser().resolve()

    # ---------------------------------------------------------
    # Validate input file
    # ---------------------------------------------------------

    if not audio_path.exists():
        emit(
            {
                "success": False,
                "code": "audio_file_missing",
                "error": (
                    "The downloaded YouTube audio file "
                    "was not found."
                ),
                "audioPath": str(audio_path)
            }
        )

        return 1

    if not audio_path.is_file():
        emit(
            {
                "success": False,
                "code": "audio_path_not_file",
                "error": (
                    "The supplied audio path is not a file."
                ),
                "audioPath": str(audio_path)
            }
        )

        return 1

    if audio_path.stat().st_size <= 0:
        emit(
            {
                "success": False,
                "code": "audio_file_empty",
                "error": (
                    "The downloaded YouTube audio file "
                    "is empty."
                ),
                "audioPath": str(audio_path)
            }
        )

        return 1

    # ---------------------------------------------------------
    # Import faster-whisper
    # ---------------------------------------------------------

    try:
        from faster_whisper import WhisperModel

    except Exception as error:
        emit(
            {
                "success": False,
                "code": "faster_whisper_missing",
                "error": (
                    "faster-whisper could not be imported."
                ),
                "details": str(error),
                "install": (
                    "py -m pip install -U faster-whisper"
                )
            }
        )

        return 1

    # ---------------------------------------------------------
    # Load local Whisper model
    # ---------------------------------------------------------

    try:
        print(
            f"Loading Whisper model: {args.model}",
            file=sys.stderr
        )

        print(
            f"Device: {args.device}",
            file=sys.stderr
        )

        print(
            f"Compute type: {args.compute_type}",
            file=sys.stderr
        )

        model = WhisperModel(
            args.model,
            device=args.device,
            compute_type=args.compute_type
        )

    except Exception as error:
        emit(
            {
                "success": False,
                "code": "whisper_model_load_failed",
                "error": (
                    "The local faster-whisper model "
                    "could not be loaded."
                ),
                "details": str(error),
                "model": args.model,
                "device": args.device,
                "computeType": args.compute_type
            }
        )

        return 1

    # ---------------------------------------------------------
    # Transcribe
    # ---------------------------------------------------------

    try:
        print(
            f"Transcribing: {audio_path.name}",
            file=sys.stderr
        )

        segments, info = model.transcribe(
            str(audio_path),
            beam_size=5,
            vad_filter=True
        )

        transcript_parts = []

        segment_count = 0

        for segment in segments:

            text = (
                segment.text
                if segment.text is not None
                else ""
            )

            text = text.strip()

            if not text:
                continue

            transcript_parts.append(
                text
            )

            segment_count += 1

        transcript = " ".join(
            transcript_parts
        ).strip()

    except Exception as error:
        emit(
            {
                "success": False,
                "code": "whisper_transcription_failed",
                "error": (
                    "Local faster-whisper transcription failed."
                ),
                "details": str(error),
                "audioPath": str(audio_path)
            }
        )

        return 1

    # ---------------------------------------------------------
    # Empty transcript check
    # ---------------------------------------------------------

    if not transcript:

        emit(
            {
                "success": False,
                "code": "whisper_transcript_empty",
                "error": (
                    "Whisper completed but produced "
                    "no readable transcript."
                ),
                "audioPath": str(audio_path)
            }
        )

        return 1

    # ---------------------------------------------------------
    # Read detected language safely
    # ---------------------------------------------------------

    detected_language = getattr(
        info,
        "language",
        None
    )

    language_probability = getattr(
        info,
        "language_probability",
        None
    )

    duration = getattr(
        info,
        "duration",
        None
    )

    # ---------------------------------------------------------
    # Successful result
    # ---------------------------------------------------------

    emit(
        {
            "success": True,
            "code": "whisper_transcription_success",

            "audioPath": str(
                audio_path
            ),

            "model": args.model,

            "device": args.device,

            "computeType": (
                args.compute_type
            ),

            "language": (
                detected_language
                or ""
            ),

            "languageProbability": (
                language_probability
                if isinstance(
                    language_probability,
                    (int, float)
                )
                else None
            ),

            "durationSeconds": (
                duration
                if isinstance(
                    duration,
                    (int, float)
                )
                else None
            ),

            "segmentCount": (
                segment_count
            ),

            "transcript": transcript,

            "transcriptCharacters": (
                len(transcript)
            ),

            "sourceGrounded": True
        }
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(
        main()
    )
