# Getting Started

> Verified against in-toto 3.x (documented commit `a8ce9ee`). Commands assume a Unix shell with Python 3.9 or newer.

## Prerequisites

- Python >=3.9 (pyproject.toml:13)
- `pip` for installation

## Install

in-toto is on PyPI and installs with pip (README.md:22).

```bash
pip install in-toto
```

This puts six commands on your PATH: `in-toto-run`, `in-toto-record`, `in-toto-verify`, `in-toto-sign`, `in-toto-mock`, and `in-toto-match-products` (pyproject.toml:50-56).

## A first working setup

The fastest way to see the core behaviour without dealing with keys is `in-toto-mock`, which generates unsigned link metadata for a command (in_toto/in_toto_mock.py:49-51). The example below follows the one in the tool's own help (in_toto/in_toto_mock.py:64-77).

1. Run a step under in-toto. This records the activity of creating a file `bar`.

```bash
in-toto-mock --name foo -- touch bar
```

This executes `touch bar` and writes an unsigned link file `foo.link` describing the command, its products, and its byproducts.

1. Inspect the recorded link. It is plain JSON.

```bash
cat foo.link
```

1. For a real, signed step, use `in-toto-run` with a signing key instead. The functionary names the step, lists materials and products, and supplies a key (in_toto/in_toto_run.py:86-91):

```bash
in-toto-run --step-name build --products bar --signing-key key_file -- touch bar
```

1. The project owner verifies the final product against a signed layout and the verification keys (in_toto/in_toto_verify.py:101):

```bash
in-toto-verify --layout root.layout --verification-keys key_file.pub
```

## Verify it works

`in-toto-verify` returns exit code 0 on success, 1 if verification fails, and 2 for wrong arguments (in_toto/in_toto_verify.py:90). Check it after a run:

```bash
in-toto-verify --layout root.layout --verification-keys key_file.pub
echo $?
```

A `0` means the recorded chain matched the layout. The tool also logs `The software product passed all verification.` on success (in_toto/verifylib.py:1637).

## Where to go next

The README walks through writing a layout, the artifact rule language, and the full run-then-verify flow (README.md). For a complete worked example see the [demo layout creation example](https://in-toto.readthedocs.io/en/latest/layout-creation-example.html) and the [in-toto/demo](https://github.com/in-toto/demo) repository. Key distribution and revocation are out of scope for in-toto itself; pair it with TUF or Sigstore for that.
