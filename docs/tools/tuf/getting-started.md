# Getting Started

> Verified against `tuf` v7.0.0. Commands assume Python >=3.10 and a POSIX shell.

## Prerequisites

- Python >=3.10 with `pip`.
- A TUF repository to talk to. The steps below use the repository example bundled in the source tree, which serves metadata and targets over HTTP.

## Install

```bash
python -m pip install tuf
```

## A first working setup

The client and repository examples in the source tree are the shortest path to a working end-to-end flow. The repository example serves an in-memory repository that is regenerated on each startup, so the client must run `tofu` (trust-on-first-use) every time the repository restarts.

1. Clone the source and start the example repository. Leave it running.

   ```bash
   git clone https://github.com/theupdateframework/python-tuf
   cd python-tuf/examples/repository
   ./repo
   ```

1. In another terminal, initialize the client with trust-on-first-use. This downloads the initial root, then constructs an `Updater`.

   ```bash
   ./examples/client/client tofu
   ```

Expected output:

```text
Trust-on-First-Use: Initialized new root in /home/you/.local/share/tuf-example/<hash>
```

1. Download a target file. The client refreshes the top-level metadata, looks up the target, checks the local cache, and downloads if needed.

   ```bash
   ./examples/client/client download file1.txt
   ```

Expected output:

```text
Target downloaded and available in ./downloads/file1.txt
```

The core API in the example is small. For production, you pass embedded root bytes through `bootstrap`, then call `refresh()`, `get_targetinfo()`, and `download_target()`:

```python
from tuf.ngclient import Updater

updater = Updater(
    metadata_dir=metadata_dir,
    metadata_base_url=f"{base_url}/metadata/",
    target_base_url=f"{base_url}/targets/",
    target_dir="./downloads",
    bootstrap=root_bytes,
)
updater.refresh()
info = updater.get_targetinfo("file1.txt")
if info is not None:
    path = updater.find_cached_target(info) or updater.download_target(info)
```

## Verify it works

A successful `download` prints the path the target was written to, and the file appears under `./downloads`. If the trusted local root is missing, the client prints a message telling you to run `tofu` or to copy a trusted `root.json` into the metadata directory ([examples/client/client](https://github.com/theupdateframework/python-tuf/blob/9a3c304/examples/client/client)).

## Where to go next

- The bundled `examples/manual_repo` scripts show how to build root, timestamp, snapshot, and targets metadata directly with the Metadata API, including hashed and succinct hash bin delegation.
- For production deployments, ship embedded root metadata bytes through `bootstrap` instead of relying on trust-on-first-use ([tuf/ngclient/updater.py:115](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/updater.py#L115)).
- The TUF specification and the official python-tuf documentation cover repository operations, key management, and delegation in depth.
