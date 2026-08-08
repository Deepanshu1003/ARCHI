"""`.env` loading: the file supplies defaults, the real environment wins."""

from __future__ import annotations

import os

from ...config.settings import load_env_file


def test_env_file_populates_missing_variables(tmp_path, monkeypatch):
    env = tmp_path / ".env"
    env.write_text(
        "# a comment\n"
        "\n"
        'GEMINI_API_KEY="from-file"\n'
        "ARCHI_GEMINI_MODEL=gemini-2.5-flash\n"
        "not a pair\n",
        encoding="utf-8",
    )
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("ARCHI_GEMINI_MODEL", raising=False)

    load_env_file(env)

    assert os.environ["GEMINI_API_KEY"] == "from-file"
    assert os.environ["ARCHI_GEMINI_MODEL"] == "gemini-2.5-flash"


def test_exported_variable_beats_the_file(tmp_path, monkeypatch):
    env = tmp_path / ".env"
    env.write_text("GEMINI_API_KEY=from-file\n", encoding="utf-8")
    monkeypatch.setenv("GEMINI_API_KEY", "exported")

    load_env_file(env)

    assert os.environ["GEMINI_API_KEY"] == "exported"


def test_missing_file_is_not_an_error(tmp_path):
    load_env_file(tmp_path / "absent.env")
