# History

## Origin

The ideas behind TUF were developed in 2009 at the University of Washington by Justin Samuel and Justin Cappos, growing out of work to improve Tor's Thandy updater. The first academic paper was co-authored with Tor's Nick Mathewson and Roger Dingledine. The problem was concrete: a software update system has to keep clients safe even after the server delivering updates, or one of its keys, is compromised. Plain signing does not survive that, so TUF introduced separated roles, threshold signatures, and freshness-bearing metadata.

In 2011 Cappos moved to NYU (then NYU Polytechnic, later NYU Tandon), where development continued in the Secure Systems Lab with contributors including Trishank Karthik Kuppusamy, Vladimir Diaz, Sebastien Awwad, and Lukas Puehringer. Development was supported by public funding from NSF and DHS.

## Timeline

| Year | Milestone |
| --- | --- |
| 2009 | TUF designed at University of Washington, derived from Tor's Thandy updater |
| 2011 | Development moves to NYU Secure Systems Lab |
| 2014 | Flynn becomes the first project to adopt TUF (an independent Go implementation) |
| 2015 | Docker releases Notary, building on TUF |
| 2016 | NYU, UMTRI, and SWRI begin Uptane, a TUF extension for automotive OTA |
| 2017 | TUF accepted into CNCF at the Incubating level (2017-10-24) |
| 2019 | TUF graduates in CNCF (2019-12-18) |
| 2026 | python-tuf v7.0.0 released (2026-05-18) |

## How it evolved

The reference codebase was reshaped around a stable, modern API. In python-tuf 1.0.0 the Metadata API (`tuf.api`) and the new client (`tuf.ngclient`) stabilized, replacing the older client and giving callers a typed, role-aware set of metadata objects. The PEP 458 effort to secure PyPI downloads was first built against python-tuf 1.0.0, then updated to 2.0.0, and used TAP 15 (succinct hash bin delegation) to keep the volume of delegated targets metadata manageable.

TUF's graduation in CNCF marked several firsts for the foundation: it was the ninth project to graduate, the first specification (rather than a piece of running software), the first security-focused project, and the first to come out of academic research.

## Where it stands now

python-tuf is the reference implementation that other language ports measure themselves against. At the pinned commit it tracks the develop branch, with the most recent release being v7.0.0 (`__version__ = "7.0.0"`, [`tuf/__init__.py:7`](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/__init__.py#L7)). The project is maintained under the TUF community in CNCF and continues to evolve the specification through TUF Augmentation Proposals (TAPs).
