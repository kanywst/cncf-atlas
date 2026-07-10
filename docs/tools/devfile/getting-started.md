# Getting Started

> Verified against `devfile/api` at commit `368ea4e` (near tag `v2.3.0`). `devfile/api` is a specification and a Go library, not a runnable server, so this walkthrough writes a devfile and then applies a parent override with the library.

## Prerequisites

- Go 1.24 or newer (the module declares `go 1.24` in `go.mod`).
- Git, to fetch the module.

## Install

Add the module to a Go project. There is no binary to install; you consume the library.

```bash
go mod init devfile-demo
go get github.com/devfile/api/v2@v2.3.0
```

## A first working setup

The goal is to see a parent devfile's override applied to a base devfile, which is the core operation the `pkg/utils/overriding` library performs.

1. Write a base devfile with one container component. Save it as `base.yaml`.

   ```yaml
   schemaVersion: "2.3.0"
   metadata:
     name: demo
   components:
     - name: tools
       container:
         image: quay.io/devfile/universal-developer-image:latest
         memoryLimit: 512Mi
   ```

1. Write a parent override that raises the memory limit of the existing `tools` component. Save it as `parent.yaml`. An override can only change elements that already exist in the base; naming a new component here would be rejected.

   ```yaml
   components:
     - name: tools
       container:
         memoryLimit: 1Gi
   ```

1. Apply the override with a short Go program. Save it as `main.go`.

   ```go
   package main

   import (
       "fmt"
       "os"

       "github.com/devfile/api/v2/pkg/utils/overriding"
       "sigs.k8s.io/yaml"
   )

   func main() {
       base, _ := os.ReadFile("base.yaml")
       parent, _ := os.ReadFile("parent.yaml")

       merged, err := overriding.OverrideDevWorkspaceTemplateSpecBytes(base, parent)
       if err != nil {
           panic(err)
       }

       out, _ := yaml.Marshal(merged)
       fmt.Print(string(out))
   }
   ```

1. Run it.

   ```bash
   go mod tidy
   go run main.go
   ```

## Verify it works

The printed result should show the `tools` container with `memoryLimit: 1Gi`, the value from the override applied on top of the base:

```yaml
components:
- container:
    image: quay.io/devfile/universal-developer-image:latest
    memoryLimit: 1Gi
  name: tools
```

To confirm the override rejects new elements, change the component name in `parent.yaml` to something that does not exist in the base (for example `extra`) and run again. `OverrideDevWorkspaceTemplateSpecBytes` returns an error, because `ensureOnlyExistingElementsAreOverridden` refuses a patch that adds a key the base does not have (`pkg/utils/overriding/overriding.go:133`).

## Where to go next

- To parse a real `devfile.yaml`, resolve its `parent`, and fetch stacks from a registry, use `devfile/library`; `devfile/api` intentionally stops at the types and the override, merge, union, and validation helpers.
- To run devfiles as live workspaces on Kubernetes, look at `devfile/devworkspace-operator`, the controller behind Eclipse Che and OpenShift Dev Spaces.
- For the full format reference, see the devfile.io documentation and the generated JSON schema under `schemas/latest/` in the repository.
