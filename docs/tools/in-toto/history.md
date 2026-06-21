# History

## Origin

in-toto began in 2015 at NYU Tandon's Secure Systems Lab, under Justin Cappos. Santiago Torres-Arias, then a student, led the development with collaborators from NJIT. The name comes from the Latin "in toto" (as a whole), reflecting the goal of verifying a supply chain end to end rather than checking artifacts in isolation ([Sbomify](https://sbomify.com/2024/08/14/what-is-in-toto/), [NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/)).

The design was published at USENIX Security 2019 as "in-toto: Providing farm-to-table guarantees for bits and bytes," which also documented the first production deployment at Datadog ([USENIX paper](https://www.usenix.org/system/files/sec19-torres-arias.pdf)). Funding came from NSF, DARPA, and AFRL ([NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Project started at NYU Tandon Secure Systems Lab ([Sbomify](https://sbomify.com/2024/08/14/what-is-in-toto/)) |
| 2016 | Python implementation repository created (2016-05-24) ([GitHub API](https://api.github.com/repos/in-toto/in-toto)) |
| 2019 | USENIX Security paper published; CNCF Sandbox accepted (2019-08-14) ([USENIX paper](https://www.usenix.org/system/files/sec19-torres-arias.pdf), [CNCF project page](https://www.cncf.io/projects/in-toto/)) |
| 2022 | Moved to the CNCF Incubator (2022-03-10) ([CNCF blog](https://www.cncf.io/blog/2022/03/10/supply-chain-security-project-in-toto-moves-to-the-cncf-incubator/)) |
| 2023 | in-toto specification v1.0 released ([CNCF project page](https://www.cncf.io/projects/in-toto/)) |
| 2025 | Graduated from CNCF; TOC vote 2025-02-10, announced 2025-04-23 ([CNCF announcement](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/)) |

## How it evolved

The project grew from a single Python tool into a layered ecosystem. The core split into a specification (in-toto/docs), an attestation framework (in-toto/attestation, the ITE-6 envelope), and reference implementations in several languages, with the Python repository documented here as the original ([NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/)). The Python code itself moved to DSSE (Dead Simple Signing Envelope) for new metadata while keeping the original Metablock format, both modeled as a single `Metadata` abstraction (in_toto/models/metadata.py:50).

The CNCF path tracked the broader rise of supply chain security after high-profile incidents. in-toto entered the Sandbox in 2019, the Incubator in 2022, and graduated in 2025 ([CNCF project page](https://www.cncf.io/projects/in-toto/)). It is the second CNCF graduated project from Cappos's lab after TUF, with which it is commonly paired ([NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/)).

## Where it stands now

in-toto is a CNCF Graduated project ([CNCF announcement](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/)). The Python implementation is on the 3.x line; at the documented commit it tracks the `develop` branch just past the v3.1.0 tag. Its stated direction is to remain the reference implementation of the in-toto specification while the attestation framework (ITE-6) serves as the envelope that SLSA and other predicate types build on ([SLSA v1.1 FAQ](https://slsa.dev/spec/v1.1/faq)).
