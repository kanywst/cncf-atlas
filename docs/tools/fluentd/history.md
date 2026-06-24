# History

## Origin

Fluentd was created in 2011 by Sadayuki "Sada" Furuhashi, a co-founder of Treasure Data, as an internal tool. The GitHub repository was created on 2011-06-19, and the project was open sourced in October 2011 ([source 5](https://en.wikipedia.org/wiki/Fluentd)). The goal was to unify log collection across many different data sources into one layer, which the project calls the "Unified Logging Layer" ([source 3](https://www.fluentd.org/architecture/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2011 | Created at Treasure Data; repository created 2011-06-19, open sourced in October |
| 2016 | Accepted into CNCF as an Incubating project (2016-11-08) |
| 2019 | Graduated from CNCF on 2019-04-11 |

## How it evolved

Fluentd entered CNCF as an Incubating project on 2016-11-08, one of the early hosted projects alongside Kubernetes and Prometheus ([source 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/)). It graduated on 2019-04-11, with more than 5,000 community users reported at that time ([source 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/)).

A lighter sister implementation, Fluent Bit, was written in C and lives under the same `fluent` GitHub organization. Fluentd itself stays on Ruby and runs with a resident memory footprint in the tens of megabytes, while Fluent Bit targets edge and Kubernetes sidecar use where a sub-megabyte footprint matters ([source 3](https://www.fluentd.org/architecture/)).

## Where it stands now

The current pinned source is master after the v1.19.2 release, with the version constant reading `VERSION = '1.19.0'` for the master development series (`lib/fluent/version.rb:19`). The project requires Ruby 3.2 or later (`fluentd.gemspec:28`) and is governed under the documented CNCF Graduated governance model. Development uses Bundler and Rake; the gem is published to RubyGems.
