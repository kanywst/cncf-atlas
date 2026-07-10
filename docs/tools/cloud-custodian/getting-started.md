# Getting Started

> Verified against the `0.9.51` release line. Commands assume Python 3.10.2 or newer and AWS credentials available in the environment.

## Prerequisites

- Python `>=3.10.2, <4.0.0` (`pyproject.toml`).
- AWS credentials reachable by boto3 (environment variables or a named profile).
- A shell where you can create a virtual environment.

## Install

```bash
python3 -m venv custodian
source custodian/bin/activate
pip install c7n
```

## A first working setup

The shortest useful policy lists running EC2 instances. It uses the default `pull` mode, so it only queries and reports unless you add actions.

1. Write the policy to `custodian.yml`:

   ```yaml
   policies:
     - name: my-first-policy
       resource: aws.ec2
       filters:
         - "State.Name": running
   ```

1. Validate it. Validation also runs automatically on `run`:

   ```bash
   custodian validate custodian.yml
   ```

1. Do a dry run, which queries resources but executes no actions:

   ```bash
   custodian run --dryrun -s out custodian.yml
   ```

1. Run it for real:

   ```bash
   custodian run -s out custodian.yml
   ```

These commands match the README quickstart ([README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md)).

## Verify it works

The `-s out` flag is the output directory. After a run, the matched resources are written to `out/<policy-name>/resources.json` by `PullMode` (`c7n/policy.py:351`). Check that file:

```bash
cat out/my-first-policy/resources.json
```

A JSON array of matched instances means the policy ran and matched. An empty array means the query ran but nothing matched the filter.

## Where to go next

- Docker: the same commands run from the `cloudcustodian/c7n` image, mounting the policy file and output directory and passing credentials through the environment ([README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md)).
- Serverless and multi-account operation, other providers, notifications, and the full filter and action reference are in the official documentation ([cloudcustodian.io](https://cloudcustodian.io/)).
