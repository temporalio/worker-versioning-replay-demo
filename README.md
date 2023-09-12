# TypeScript Worker Versioning Demo

This repository demos how to set up Temporal TypeScript project that uses [worker versioning][worker-versioning-docs].

It includes:

1. A simple workflow and activity
1. A worker that's set up to use versioning
1. A client to signal all running workflows
1. GitHub Actions workflows to build a worker docker image and run [release validation](#release-validation)
1. Build scripts

### Prerequisites

- Node.js >= 18
- [Temporal CLI](https://docs.temporal.io/cli/)

### Installation

```
npm ci
```

### Environment Variables

These enviroment variables are supported by the worker and client of the provided application as well as
Temporal CLI unless mentioned otherwise.

**`BUILD_ID`** - Build ID for the worker to use (required)

**`TEMPORAL_ADDRESS`** - Address of Temporal Server (optional)

**`TEMPORAL_NAMESPACE`** - Namespace to use (optional)

**`TEMPORAL_TLS_CERT`** - Path to TLS Certificate (optional)

**`TEMPORAL_TLS_KEY`** - Path to TLS private key (optional)

**`TEMPORAL_TASK_QUEUE`** - Task queue to use (optional) (not supported in CLI)

### Branches

#### `main`

Includes the "first" workflow version, which we'll call V1.

#### [`workflow-v2`][diff-main-v2]

Based on `main` and contains a modified, incompatible version of the V1 workflow (V2).

#### [`workflow-v2.1`][diff-v2-v21]

based on `workflow-v2` and contains a modified, compatible version of the V2 workflow.

[worker-versioning-docs]: https://docs.temporal.io/workers#worker-versioning
[diff-main-v2]: https://github.com/temporalio/worker-versioning-replay-demo/compare/main...workflow-v2
[diff-v2-v21]: https://github.com/temporalio/worker-versioning-replay-demo/compare/workflow-v2...workflow-v2.1

### Running the Demo

1. Export any [environment variables](#environment-variables) required to connect to your namespace.

1. Run the [first version](#main) of the workflow code, either directly with `npm run worker` or using a prebuilt docker
   image (either via GitHub actions or [locally](#building-the-docker-image). Make sure to set the `BUILD_ID`
   environment if run outside of docker.

1. Add the build ID as default for the task queue:

   ```
   temporal task-queue update-build-ids add-new-default \
     --task-queue versioned-queue \
     --build-id $MY_V1_BUILD_ID
   ```

1. Start a couple of workflows:

   ```
   temporal workflow start \
    --task-queue versioned-queue \
    --type versioningExample \
    --workflow-id wf-1
   temporal workflow start \
    --task-queue versioned-queue \
    --type versioningExample \
    --workflow-id wf-2
   ```

1. Check your worker logs and ensure it picks up those workflows. They will continue running on this worker for the
   duration of this demo.

1. Inspect these workflows in the Temporal web UI and see the added versioning information.

1. Run the [second version](#workflow-v2) of the workflow. This can be done either by switching to the `workflow-v2`
   branch and running `npm run worker` or by running a container with an image built from that branch. Make sure to set
   a new `BUILD_ID` for this worker if run outside of docker.

1. Add the new incompatible build ID as default for the task queue:

   ```
   temporal task-queue update-build-ids add-new-default \
     --task-queue versioned-queue \
     --build-id $MY_V2_BUILD_ID
   ```

1. Run another workflow:

   ```
   temporal workflow start \
     --task-queue versioned-queue \
     --type versioningExample \
     --workflow-id wf-3
   ```

1. Check the second worker's logs and ensure it picks up the workflow.

1. Inspect the workflow in the Temporal web UI.

1. Signal all workflows and inspect worker logs an UI. You should see wf-1 and wf-2 signals processed on the first
   worker and wf-3 on the second.

   ```
   npm run sender
   ```

1. Run the [third version](#workflow-v21) of the workflow. This can be done either by switching to the `workflow-v2.1`
   branch and running `npm run worker` or by running a container with an image built from that branch. Make sure to set
   a new `BUILD_ID` for this worker if run outside of docker.

1. Add the new compatible build ID as default for the task queue. As soon as the versioning propagate, polls from the
   second worker will start failing because there's a newer compatible build ID.

   ```
   temporal task-queue update-build-ids add-new-compatible \
     --task-queue versioned-queue \
     --build-id $MY_V2_1_BUILD_ID \
     --existing-compatible-build-id $MY_V2_BUILD_ID
   ```

1. Run another workflow:

   ```
   temporal workflow start \
     --task-queue versioned-queue \
     --type versioningExample \
     --workflow-id wf-4
   ```

1. Check the third worker's logs and ensure it picks up the workflow.

1. Inspect the workflow in the Temporal web UI.

1. Signal all workflows to finish and inspect worker logs an UI. You should see wf-1 and wf-2 signals processed on the
   first worker and wf-3 and wf-4 on the third.

   ```
   npm run finisher
   ```

1. Check the reachability of the build IDs to see which workers can be retired:

   ```
   temporal task-queue get-build-id-reachability \
     --build-id $MY_V1_BUILD_ID \
     --build-id $MY_V2_BUILD_ID
     --build-id $MY_V2_1_BUILD_ID
   ```

### Building the Docker Image

```
docker build --tag $MY_IMAGE_TAG --build-arg BUILD_ID=$MY_BUILD_ID .
```

### Setting up the GitHub Action

1. Modify the `IMAGE_NAME` enviroment variable to push to an authorized docker registry.
1. Paste your docker credentials as `DOCKER_USERNAME` and `DOCKER_PASSWORD` (or use a token instead) as GitHub Actions
   secrets on your forked repository.
1. Modify the `TEMPORAL_ADDRESS` and `TEMPORAL_NAMESPACE` enviroment variables in [`ci.yml`](.github/workflows/ci.yml)
   so they're directed at your server and namespace.
1. Paste your TLS certificate and private key as `TEMPORAL_CLIENT_CERT` and `TEMPORAL_CLIENT_KEY` GitHub Actions secrets
   on your forked repository.

### Release Validation

The release validation process uses existing workflow histories from a given compatible version set and replays them
with the current version of the workflows to verify that the code was modified in a backwards compatible way.

The process is triggered on a GitHub pull request if the pull request title contains a `[compatible-BUILD_ID]` prefix.
For example to verify that a commit is compatible with build ID `foo`, prefix your pull request title with
`[compatible-foo]`.
