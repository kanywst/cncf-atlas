# Getting Started

> Verified against the install flow documented for v2.14. Commands assume a Linux host with Docker and Docker Compose.

## Prerequisites

- A Linux host with `docker` 20.10.10-ce or newer and `docker-compose` 1.18.0 or newer (`README.md:57`).
- Enough disk for the registry, database, and any cached images.
- A hostname or IP that clients will use to reach Harbor.

## Install

Harbor is installed from a release bundle, not a single binary. Download the offline (or online) installer from the [releases page](https://github.com/goharbor/harbor/releases) and unpack it.

```bash
tar xzvf harbor-offline-installer-v2.14.4.tgz
cd harbor
```

## A first working setup

Create the config from the bundled template and set your hostname.

```bash
cp harbor.yml.tmpl harbor.yml
```

Edit `harbor.yml`: set `hostname` to your host's address, and either configure the `https` certificate paths or comment out the `https` block for an HTTP-only trial. The admin password is set with `harbor_admin_password`.

Run the installer. It generates configs and starts the containers with Docker Compose. To include the Trivy scanner, run `sudo ./install.sh --with-trivy`.

```bash
sudo ./install.sh
```

Expected tail of the output:

```text
[Step 5]: starting Harbor ...
✔ ----Harbor has been installed and started successfully.----
```

Log in with the Docker CLI, push an image, and it lands in a Harbor project.

```bash
docker login your-harbor-host
docker tag myuser/app:1.0 your-harbor-host/library/app:1.0
docker push your-harbor-host/library/app:1.0
```

For Kubernetes, deploy with the [Harbor Helm chart](https://github.com/goharbor/harbor-helm) instead of `install.sh` (`README.md:61`).

## Verify it works

Check that the containers are healthy and the portal answers.

```bash
sudo docker-compose ps
```

Open the portal at your hostname in a browser and log in as `admin` with the password from `harbor.yml`. The default `library` project should be visible, and a pushed image should appear under it with its tags, size, and scan status.

## Where to go next

See the [Installation & Configuration Guide](https://goharbor.io/docs/latest/install-config/) for HTTPS setup, external PostgreSQL and Redis, high availability, and storage backends. Production hardening (RBAC design, OIDC integration, replication policies, retention, and quotas) is covered in the [Harbor documentation](https://goharbor.io/docs/).
