# History

## Origin

Strimzi started inside Red Hat in 2017. A small team of three developers looked at how to run stateful workloads like Apache Kafka on Kubernetes ([Red Hat Developer](https://developers.redhat.com/articles/2024/06/26/open-innovation-red-hats-impact-kafka-and-strimzi-ecosystem)). The first public release, `0.1.0`, shipped in January 2018 as a set of Docker images and Kubernetes YAML. The `0.2.0` release in March 2018 was the first version that looked like the operator pattern Strimzi uses today ([Strimzi incubation blog](https://strimzi.io/blog/2024/02/08/strimzi-incubation/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Red Hat begins exploring Kafka on Kubernetes with three developers |
| 2018 | `0.1.0` (Docker images plus YAML); `0.2.0` adopts the operator pattern |
| 2019 | Donated to the CNCF and accepted as a Sandbox project on 2019-08-28 |
| 2024 | Promoted to CNCF Incubating on 2024-02-08 |

## How it evolved

The project moved from a bundle of images and manifests to a full operator that reconciles Kafka clusters from custom resources. Strimzi was accepted into the CNCF Sandbox on 2019-08-28 ([CNCF projects](https://www.cncf.io/projects/strimzi/)) and promoted to Incubating on 2024-02-08. At promotion the project reported more than 1600 contributors, more than 180 contributing organisations, and 15 public adopters ([CNCF blog](https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/)).

The largest recent shift follows Apache Kafka itself. The code at this commit has dropped ZooKeeper entirely and runs KRaft only, because Kafka 4.x (4.3.0 here, `pom.xml:87`) is KRaft only. KRaft metadata handling lives in `KRaftMetadataManager.java` and `KRaftVersionChangeCreator.java`. The `Kafka` custom resource has also reached the `v1` API version (`api/src/main/java/io/strimzi/api/kafka/model/kafka/Kafka.java:80`), promoted from the earlier `v1beta2`, which lines up with the 1.0 major release series.

## Where it stands now

Strimzi is a CNCF Incubating project under neutral governance defined in a separate [governance repository](https://github.com/strimzi/governance/blob/main/GOVERNANCE.md). The pinned commit `9505103` (2026-06-23) sits on `main` after the `1.0.1` stable release (2026-06-17) and around the `1.1.0-rc1` (2026-06-22) line. Releases continue on a regular cadence tracking upstream Apache Kafka versions.
