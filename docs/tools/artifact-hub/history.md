# History

## Origin

Artifact Hub grew out of a recurring problem in the Cloud Native ecosystem: artifacts were hard to find. Before it existed, users relied on the now-deprecated Helm Hub or on general-purpose search to locate charts and other content. The effort started around the 2019 KubeCon + CloudNativeCon NA in San Diego, where CNCF's founding executive director Dan Kohn gathered people around the discoverability problem. Maintainer Matt Farina is quoted on the project's origins in the CNCF announcement.

The repository `artifacthub/hub` was created on 2020-01-14. The design choice from the start was to index artifacts rather than host them: provide search, filtering, and browsing, and link back to the original source.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Discoverability problem raised at KubeCon NA San Diego; project effort begins |
| 2020 | Repository `artifacthub/hub` created (2020-01-14); accepted into CNCF Sandbox (2020-06-25) |
| 2024 | CNCF TOC votes to move it to Incubating (2024-05-30); public announcement (2024-09-17) |
| 2025 | Release v1.22.0 (2025-10-21) |

## How it evolved

The project began close to Helm, effectively succeeding Helm Hub. Over time its scope widened from charts to "an index for any CNCF artifact," supporting more than twenty artifact kinds. That broadened mission is what it carried into CNCF Incubating status. The CNCF announcement notes the project reached Incubating with a community of 41 volunteers.

## Where it stands now

Artifact Hub is a CNCF Incubating project, maintained by a community centered on CNCF and SUSE engineers. The most recent tagged release at the documented commit is v1.22.0 (2025-10-21); the commit under study sits on `master` after that tag. The CNCF runs the public instance at `artifacthub.io`, and the project continues to add support for new artifact kinds.
