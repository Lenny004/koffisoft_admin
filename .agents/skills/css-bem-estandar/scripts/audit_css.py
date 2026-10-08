#!/usr/bin/env python3
"""Audita CSS global, CSS Modules, Angular CSS o estilos de Svelte."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


BEM_CLASS = re.compile(
    r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*"
    r"(?:__(?:[a-z0-9]+(?:-[a-z0-9]+)*)+)?"
    r"(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$"
)
STATE_CLASS = re.compile(r"^(?:is|has|js)-[a-z0-9-]+$")
CLASS_IN_SELECTOR = re.compile(r"(?<![\w-])\.([a-zA-Z_][a-zA-Z0-9_-]*)")
ID_IN_SELECTOR = re.compile(r"(?<![\w-])#[a-zA-Z_][a-zA-Z0-9_-]*")
COLOR_LITERAL = re.compile(r"#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(", re.I)
TYPOGRAPHY_PX = re.compile(
    r"\b(?:font-size|line-height|letter-spacing|word-spacing|text-indent|font)\s*:[^;{}]*\b\d+px\b",
    re.I,
)
TRANSITION_ALL = re.compile(r"\btransition\s*:\s*all\b", re.I)


class Violation:
    def __init__(self, path: Path, line: int, code: str, message: str) -> None:
        self.path = path
        self.line = line
        self.code = code
        self.message = message

    def __str__(self) -> str:
        return f"{self.path}:{self.line}: {self.code} {self.message}"


def mask_comments(text: str) -> str:
    """Conserva saltos de línea para que las posiciones sigan siendo útiles."""
    return re.sub(r"/\*.*?\*/", lambda match: "\n" * match.group(0).count("\n"), text, flags=re.S)


def is_valid_class(name: str, mode: str) -> bool:
    if mode == "module":
        return bool(re.fullmatch(r"[A-Za-z_][A-Za-z0-9_-]*", name))
    return bool(BEM_CLASS.fullmatch(name) or STATE_CLASS.fullmatch(name))


def line_number(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def inspect_css(path: Path, css: str, mode: str, line_offset: int = 0) -> list[Violation]:
    masked = mask_comments(css)
    violations: list[Violation] = []

    def add(line: int, code: str, message: str) -> None:
        violations.append(Violation(path, line + line_offset, code, message))

    stack: list[bool] = []
    for index, raw_line in enumerate(masked.splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            continue

        if re.search(r"!important\b", line, re.I):
            add(index, "IMP", "elimina !important y corrige la cascada o la especificidad")
        if TRANSITION_ALL.search(line):
            add(index, "TRANS", "transition: all no está permitido")
        if TYPOGRAPHY_PX.search(line):
            add(index, "PX", "usa rem o un token en propiedades tipográficas")

        allowed_token_scope = any(stack)
        if COLOR_LITERAL.search(line) and not allowed_token_scope:
            add(index, "COLOR", "color hardcodeado fuera de :root o @theme")

        cursor = 0
        for character_index, character in enumerate(raw_line):
            if character == "{":
                prefix = raw_line[cursor:character_index].strip()
                stack.append(bool(re.search(r"(?:^|\s):root\b|@theme\b", prefix)))
                cursor = character_index + 1
            elif character == "}":
                if stack:
                    stack.pop()
                cursor = character_index + 1

    for match in re.finditer(r"([^{}]+)\{", masked, re.S):
        selector_text = match.group(1).strip()
        selector_line = line_number(masked, match.start(1)) + line_offset
        for selector in selector_text.split(","):
            selector = selector.strip()
            if not selector or selector.startswith("@"):
                continue
            if ID_IN_SELECTOR.search(selector):
                add(selector_line - line_offset, "ID", "selector por ID; usa una clase BEM")

            for class_match in CLASS_IN_SELECTOR.finditer(selector):
                class_name = class_match.group(1)
                if not is_valid_class(class_name, mode):
                    add(
                        selector_line - line_offset,
                        "BEM",
                        f"la clase .{class_name} no cumple el patrón permitido para --mode {mode}",
                    )

            parts = [part for part in re.split(r"\s+|[>+~]", selector) if part]
            if len(parts) > 3:
                add(selector_line - line_offset, "DEPTH", "selector con más de 3 niveles")

    return violations


def extract_svelte_styles(path: Path) -> list[tuple[str, int]]:
    text = path.read_text(encoding="utf-8")
    styles: list[tuple[str, int]] = []
    for match in re.finditer(r"<style\b[^>]*>(?P<css>.*?)</style\s*>", text, re.I | re.S):
        styles.append((match.group("css"), text.count("\n", 0, match.start("css"))))
    return styles


def collect_files(paths: list[Path], mode: str) -> list[Path]:
    extensions = {".svelte"} if mode == "svelte" else {".css"}
    collected: list[Path] = []
    for target in paths:
        if target.is_file() and target.suffix.lower() in extensions:
            collected.append(target)
        elif target.is_dir():
            collected.extend(item for item in target.rglob("*") if item.is_file() and item.suffix.lower() in extensions)
    return sorted(set(collected))


def main() -> int:
    parser = argparse.ArgumentParser(description="Audita CSS según css-bem-estandar.")
    parser.add_argument("--mode", choices=("global", "module", "angular", "svelte"), default="global")
    parser.add_argument("paths", nargs="+", type=Path, help="archivos o directorios que se deben auditar")
    args = parser.parse_args()

    files = collect_files(args.paths, args.mode)
    if not files:
        print(f"No se encontraron archivos para --mode {args.mode}.")
        return 0

    violations: list[Violation] = []
    blocks = 0
    for path in files:
        if args.mode == "svelte":
            styles = extract_svelte_styles(path)
            blocks += len(styles)
            for css, offset in styles:
                violations.extend(inspect_css(path, css, args.mode, offset))
        else:
            violations.extend(inspect_css(path, path.read_text(encoding="utf-8"), args.mode))

    for violation in violations:
        print(violation)

    if args.mode == "svelte":
        print(f"\nResumen: {len(files)} archivo(s), {blocks} bloque(s) <style>, {len(violations)} violación(es).")
    else:
        print(f"\nResumen: {len(files)} archivo(s), {len(violations)} violación(es).")
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
