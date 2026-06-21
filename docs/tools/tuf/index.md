# The Update Framework (TUF)

> A framework for securing software update systems so that a compromised repository or signing key cannot push malicious updates to clients.

- **Category**: Supply Chain
- **CNCF maturity**: Graduated
- **Language**: Python (>=3.10)
- **License**: Apache-2.0 OR MIT (dual)
- **Repository**: [theupdateframework/python-tuf](https://github.com/theupdateframework/python-tuf)
- **Documented at commit**: `9a3c304` (near tag v7.0.0, 2026-05-18)

## What it is

TUF is a specification for compromise-resilient software updates, and python-tuf is its reference implementation. The threat it addresses is not "is this file corrupted" but "what happens after an attacker takes over the repository or steals a signing key". TUF answers that with separated roles, threshold signatures, offline keys, key revocation, and metadata that carries freshness (expiry), ordering, and version information so clients can reject rollback and freeze attacks.

python-tuf ships as a library, not a CLI. The public surface is `tuf.ngclient`, which exports `Updater`, `UpdaterConfig`, `FetcherInterface`, `Urllib3Fetcher`, and `TargetFile` ([`tuf/ngclient/__init__.py:6`](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/__init__.py#L6)). A lower-level Metadata API (`tuf.api`) handles serialization and signature verification, and `tuf.repository` provides the base class for building repository-side tooling.

It sits underneath a software distribution system. A package index, an artifact CDN, or a signing service uses TUF metadata to let clients verify what they download against signed, role-separated metadata before trusting it.

## When to use it

- You distribute software or artifacts and need clients to keep verifying integrity even if your repository or one signing key is compromised.
- You need protection against rollback (serving an old, vulnerable version) and freeze (withholding updates) attacks, not just file integrity.
- You are implementing a signed metadata layer for a package index (PEP 458 for PyPI) or a trust-root distribution channel (Sigstore).
- It is not the right fit when you only need to verify that a single file matches a known hash, or when a detached signature (GPG) over one artifact is enough.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [theupdateframework/python-tuf source, pinned `9a3c304`](https://github.com/theupdateframework/python-tuf)
2. [The Update Framework (TUF), CNCF project page](https://www.cncf.io/projects/the-update-framework-tuf/)
3. [The Update Framework, Wikipedia](https://en.wikipedia.org/wiki/The_Update_Framework)
4. [CNCF Announces TUF Graduation, PRNewswire](https://www.prnewswire.com/news-releases/cloud-native-computing-foundation-announces-tuf-graduation-300976974.html)
5. [Open-source system to secure software updates graduates, NYU Tandon](https://engineering.nyu.edu/news/open-source-system-secure-software-updates-graduates-protect-leading-cloud-services)
6. [PEP 458: Secure PyPI downloads with signed repository metadata](https://peps.python.org/pep-0458/)
7. [Implementing PEP 458 to Secure PyPI Downloads, VMware OSS blog](https://blogs.vmware.com/opensource/2022/09/22/implementing-pep-458-to-secure-pypi-downloads/)
8. [Sigstore: Bring-your-own sTUF with TUF, Sigstore blog](https://blog.sigstore.dev/sigstore-bring-your-own-stuf-with-tuf-40febfd2badd/)
9. [sigstore/sigstore-python releases](https://github.com/sigstore/sigstore-python/releases)
10. [tuf on PyPI](https://pypi.org/project/tuf/)
