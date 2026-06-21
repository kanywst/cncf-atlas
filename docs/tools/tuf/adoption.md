# Adoption & Ecosystem

## Who uses it

The cases below are ones that use python-tuf specifically as the TUF client or repository engine, each with a citable source. TUF the specification has wider production adoption (Notary, Uptane in automotive, and others), but those often run a different implementation, so they are out of scope here.

| Organisation | Use case | Source |
| --- | --- | --- |
| PyPI / Warehouse | PEP 458 secures PyPI downloads with signed repository metadata; the implementation depends on python-tuf and uses TAP 15 succinct hash bin delegation | [PEP 458](https://peps.python.org/pep-0458/), [VMware OSS blog](https://blogs.vmware.com/opensource/2022/09/22/implementing-pep-458-to-secure-pypi-downloads/) |
| Sigstore (sigstore-python) | Distributes the Sigstore trust root (`trusted_root.json`) over TUF; sigstore-python uses python-tuf as its client engine, anchored on an embedded root | [Sigstore blog](https://blog.sigstore.dev/sigstore-bring-your-own-stuf-with-tuf-40febfd2badd/), [sigstore-python releases](https://github.com/sigstore/sigstore-python/releases) |
| RSTUF (Repository Service for TUF) | Productizes the PEP 458 design as a service for general repositories, built on python-tuf; accepted into the OpenSSF sandbox | [VMware OSS blog](https://blogs.vmware.com/opensource/2022/09/22/implementing-pep-458-to-secure-pypi-downloads/) |

## Adoption signals

python-tuf is the reference implementation referenced by the TUF specification, which is itself the basis for other language ports. It is published on PyPI and installed with `pip install tuf` ([tuf on PyPI](https://pypi.org/project/tuf/)). The most recent release at the pinned commit is v7.0.0 (2026-05-18). TUF graduated in CNCF on 2019-12-18 as the ninth graduated project and the first specification, the first security-focused project, and the first from academic research ([CNCF project page](https://www.cncf.io/projects/the-update-framework-tuf/), [PRNewswire](https://www.prnewswire.com/news-releases/cloud-native-computing-foundation-announces-tuf-graduation-300976974.html)).

## Ecosystem

- RSTUF builds repository-as-a-service on top of python-tuf's repository helpers.
- Other language implementations of the same specification: go-tuf (Go, used around Notary and Sigstore), rust-tuf (Rust), tuf-js / @sigstore/tuf (JavaScript), and a Ruby port for RubyGems.
- Derived specifications: Uptane (automotive OTA, a TUF extension) and the TUF Augmentation Proposals (TAPs, e.g. TAP 15 succinct hash bin delegation).
- Adjacent supply-chain projects: in-toto (build provenance, from the same Secure Systems Lab, complementary to TUF), Sigstore (signing and transparency logs, uses TUF to distribute its trust root), and Notary v2 / Notation.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| go-tuf | Go implementation of the same TUF specification; preferred where the surrounding stack is Go (Notary, parts of Sigstore) |
| tuf-js / @sigstore/tuf | JavaScript/TypeScript TUF client for Node and browser-adjacent toolchains |
| Detached signatures (GPG, minisign) | Verify a single artifact against one key; no role separation, threshold signing, freshness, or rollback protection |
| in-toto | Attests how an artifact was built (supply-chain provenance) rather than securing the distribution and update channel; complementary to TUF |

The choice between python-tuf and another port is usually decided by the language of the surrounding toolchain, since all ports implement the same specification.
