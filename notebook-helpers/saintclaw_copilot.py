"""SaintClaw training copilot helper for Jupyter notebooks.

The helper is a thin client over the SaintClaw participant copilot API. It:

    - calls OpenRouter via SaintClaw's governed proxy, never directly,
    - applies the participant model allowlist set by the platform,
    - logs every call against the participant's training session so
      facilitators can see usage per module and per exercise,
    - prints model id, token counts, and latency for every response so
      participants always see the cost of asking.

Quick start
-----------

    import sys, pathlib
    sys.path.insert(
        0, str((pathlib.Path.cwd() / ".." / ".." / "notebook-helpers").resolve())
    )
    import saintclaw_copilot as co

    # Required environment for the helper. Get the participant token from
    # the academy Studio panel after signing in to your cohort.
    #   SAINTCLAW_BASE_URL          (defaults to https://saintagi.com)
    #   SAINTCLAW_INVITE_CODE       cohort invite code
    #   SAINTCLAW_PARTICIPANT_TOKEN check-in token from the academy
    #   SAINTCLAW_MODULE_SLUG       e.g. ai-in-banking-and-finance

    result = co.ask("Frame churn prediction as an ML problem in 5 bullets")
    print(result.output)

    rows = co.compare(
        "Draft a one-paragraph executive summary on AI risk in retail banking.",
        models=[
            "openrouter/anthropic/claude-3.5-haiku",
            "openrouter/openai/gpt-4o-mini",
        ],
    )
    for row in rows:
        print(row.model, row.latency_ms, row.input_tokens, row.output_tokens)

The helper purposefully exposes a small surface area. Anything more
elaborate (custom system prompts, tools, structured output) should be
expressed as a prompt template in the module's prompt library.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Iterable, List, Optional, Sequence

DEFAULT_BASE_URL = "https://saintagi.com"
DEFAULT_TIMEOUT_SECONDS = 60
COPILOT_PATH = "/api/training/participant/copilot"


class CopilotConfigError(RuntimeError):
    """Raised when the helper is missing required configuration."""


class CopilotRequestError(RuntimeError):
    """Raised when the SaintClaw API returns an error envelope."""


@dataclass
class CopilotResult:
    """Single model response from the SaintClaw copilot."""

    model: str
    output: str
    status: str
    latency_ms: int
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    total_tokens: Optional[int]
    cost_usd: Optional[float]
    redactions: int
    request_id: str
    error_message: Optional[str] = None
    error_code: Optional[str] = None

    def summary_line(self) -> str:
        cost = f"${self.cost_usd:.5f}" if self.cost_usd is not None else "n/a"
        tokens = (
            f"{self.input_tokens or 0}+{self.output_tokens or 0}={self.total_tokens or 0}"
        )
        return (
            f"[copilot] model={self.model} status={self.status} "
            f"latency={self.latency_ms}ms tokens={tokens} cost={cost} "
            f"redactions={self.redactions} request_id={self.request_id}"
        )


@dataclass
class CopilotConfig:
    base_url: str
    invite_code: str
    token: str
    module_slug: str

    @classmethod
    def from_environment(cls) -> "CopilotConfig":
        try:
            invite = os.environ["SAINTCLAW_INVITE_CODE"]
            token = os.environ["SAINTCLAW_PARTICIPANT_TOKEN"]
            module_slug = os.environ["SAINTCLAW_MODULE_SLUG"]
        except KeyError as missing:
            raise CopilotConfigError(
                "SaintClaw copilot is not configured. Set "
                "SAINTCLAW_INVITE_CODE, SAINTCLAW_PARTICIPANT_TOKEN, and "
                f"SAINTCLAW_MODULE_SLUG. Missing: {missing.args[0]}"
            ) from missing

        return cls(
            base_url=os.environ.get("SAINTCLAW_BASE_URL", DEFAULT_BASE_URL).rstrip("/"),
            invite_code=invite,
            token=token,
            module_slug=module_slug,
        )


def _post(payload: dict, *, config: Optional[CopilotConfig] = None) -> dict:
    cfg = config or CopilotConfig.from_environment()
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{cfg.base_url}{COPILOT_PATH}",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {cfg.token}",
            "User-Agent": "SaintClaw-Notebook-Helper/0.1",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=DEFAULT_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as http_error:
        try:
            envelope = json.loads(http_error.read().decode("utf-8"))
        except Exception:
            envelope = {}
        message = (envelope.get("error") or {}).get("message") or http_error.reason
        raise CopilotRequestError(
            f"SaintClaw copilot HTTP {http_error.code}: {message}"
        ) from http_error
    except urllib.error.URLError as url_error:
        raise CopilotRequestError(
            f"SaintClaw copilot request failed: {url_error.reason}"
        ) from url_error


def _to_results(envelope: dict) -> List[CopilotResult]:
    data = envelope.get("data") or {}
    raw_results = data.get("results") or []
    out: List[CopilotResult] = []
    for raw in raw_results:
        out.append(
            CopilotResult(
                model=str(raw.get("model") or ""),
                output=str(raw.get("output") or ""),
                status=str(raw.get("status") or "completed"),
                latency_ms=int(raw.get("latencyMs") or 0),
                input_tokens=raw.get("inputTokens"),
                output_tokens=raw.get("outputTokens"),
                total_tokens=raw.get("totalTokens"),
                cost_usd=raw.get("costUsd"),
                redactions=int(raw.get("redactions") or 0),
                request_id=str(raw.get("requestId") or ""),
                error_message=raw.get("errorMessage"),
                error_code=raw.get("errorCode"),
            )
        )
    return out


def _print_summary(results: Iterable[CopilotResult]) -> None:
    for result in results:
        print(result.summary_line())


def ask(
    prompt: str,
    *,
    system: Optional[str] = None,
    model: Optional[str] = None,
    temperature: float = 0,
    max_tokens: int = 1024,
    exercise_id: Optional[str] = None,
    scope: str = "notebook",
    scope_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    config: Optional[CopilotConfig] = None,
    silent: bool = False,
    intent: str = "ask",
) -> CopilotResult:
    """Run a single copilot call and return the result."""

    cfg = config or CopilotConfig.from_environment()
    payload = {
        "inviteCode": cfg.invite_code,
        "moduleSlug": cfg.module_slug,
        "prompt": prompt,
        "system": system,
        "temperature": temperature,
        "maxTokens": int(max_tokens),
        "intent": intent,
        "surface": "notebook",
        "scope": scope,
        "scopeId": scope_id,
        "exerciseId": exercise_id,
        "metadata": metadata or {},
    }
    if model:
        payload["model"] = model

    envelope = _post(payload, config=cfg)
    results = _to_results(envelope)
    if not results:
        raise CopilotRequestError("SaintClaw copilot returned no results.")
    result = results[0]
    if not silent:
        _print_summary([result])
    if result.status == "blocked":
        raise CopilotRequestError(result.error_message or "Copilot call was blocked.")
    return result


def compare(
    prompt: str,
    models: Sequence[str],
    *,
    system: Optional[str] = None,
    temperature: float = 0,
    max_tokens: int = 1024,
    exercise_id: Optional[str] = None,
    scope: str = "notebook",
    scope_id: Optional[str] = None,
    metadata: Optional[dict] = None,
    config: Optional[CopilotConfig] = None,
    silent: bool = False,
) -> List[CopilotResult]:
    """Send the same prompt to several models and return one result per model."""

    if not models:
        raise ValueError("compare() requires at least one model.")

    cfg = config or CopilotConfig.from_environment()
    payload = {
        "inviteCode": cfg.invite_code,
        "moduleSlug": cfg.module_slug,
        "prompt": prompt,
        "system": system,
        "models": list(models),
        "temperature": temperature,
        "maxTokens": int(max_tokens),
        "intent": "compare",
        "surface": "notebook",
        "scope": scope,
        "scopeId": scope_id,
        "exerciseId": exercise_id,
        "metadata": metadata or {},
    }

    envelope = _post(payload, config=cfg)
    results = _to_results(envelope)
    if not silent:
        _print_summary(results)
    return results


def critique(
    artifact: str,
    rubric: str,
    *,
    model: Optional[str] = None,
    exercise_id: Optional[str] = None,
    config: Optional[CopilotConfig] = None,
    silent: bool = False,
) -> CopilotResult:
    """Ask the copilot to critique a participant artifact against a rubric."""

    prompt = (
        "You are a strict reviewer. Critique the artifact strictly against the "
        "rubric. Quote the rubric clauses you reference. Output:\n"
        "1) three specific things the artifact does well\n"
        "2) three specific weaknesses with quotes\n"
        "3) a list of one-line concrete fixes\n\n"
        f"--- RUBRIC ---\n{rubric}\n\n--- ARTIFACT ---\n{artifact}"
    )
    return ask(
        prompt,
        model=model,
        intent="critique",
        exercise_id=exercise_id,
        config=config,
        silent=silent,
    )


def explain(
    code_or_traceback: str,
    *,
    model: Optional[str] = None,
    exercise_id: Optional[str] = None,
    config: Optional[CopilotConfig] = None,
    silent: bool = False,
) -> CopilotResult:
    """Explain a code snippet or traceback in plain language without writing code."""

    prompt = (
        "Explain the following snippet or traceback to a banking analyst. "
        "Do NOT write replacement code. Cover:\n"
        "- what is happening line by line in 3-6 bullets\n"
        "- the most likely root cause if this is a traceback\n"
        "- the next 1-2 things the analyst should try\n\n"
        f"--- INPUT ---\n{code_or_traceback}"
    )
    return ask(
        prompt,
        model=model,
        intent="explain",
        exercise_id=exercise_id,
        config=config,
        silent=silent,
    )


__all__ = [
    "CopilotConfig",
    "CopilotConfigError",
    "CopilotRequestError",
    "CopilotResult",
    "ask",
    "compare",
    "critique",
    "explain",
]
