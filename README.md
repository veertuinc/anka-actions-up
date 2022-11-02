# Anka Actions - Up

This action is mean to be used with [anka-actions-down](https://github.com/veertuinc/anka-actions-up). Please be sure to read this first.

## Prerequisites

1. Install the github runner inside of your VM. This can be done with [our installation script](https://github.com/veertuinc/getting-started/blob/master/GITHUB_ACTIONS/install.sh).

2. Add your Github [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) and add it to your repo under https://github.com/{USER/ORG}/{REPONAME}/settings/secrets/actions. Your PAT should have "repo" if using classic tokens. Also, the user with the PAT must be added as an Admin collaborator to the repository. Fine-grained are not supported at the time of writing this.

### Inputs

| input name  | required? | description |
|--------------|-------------|-----------|
| `gh-pat` | **yes** | Github personal access token (requires `repo` scope in order to be able to create/remove self-hosted runners in the repository) |
| `controller-url` | **yes** | The Anka Build Cloud Controller's URL to communicate with |
| `template-id` | **yes** | UUID of the Anka VM Template in the Anka Build Cloud Registry. |
| `template-tag` | no | Anka VM Template's Tag |
| `template-runner-dir` | no | The directory where the runner was installed. |
| `gh-owner` | no | GitHub repository owner |
| `gh-repository` | no | GitHub repository the github action runner will be attached to |
| `controller-root-token` | no | Anka Build Cloud Controller's Root Token used for authentication |
| `controller-tls-ca` | no | Anka Build Cloud Controller TLS certificate's CA (needed if controller TLS cert is self-signed) |
| `controller-https-skip-cert-verify` | no | Skip the Anka Build Cloud Controller's TLS certificate verification |
| `controller-auth-cert` | no | Certificate to use for authorization with the Anka Build Cloud Controller |
| `controller-auth-cert-key` | no | Private key to use for authorization with the Anka Build Cloud Controller |
| `controller-auth-cert-passphrase` | no | The Auth Certificate's passphrase |
| `controller-http-poll-delay` | no | Delay (in seconds) between the HTTP requests to the Anka Build Cloud Controller's API |
| `job-ttl` | no | TTL (in seconds) after which job will be forced to stop (fails with error) (disable with `0`) |
| `group-id` | no | Anka Node Group ID (not name) to target for starting the VM |
| `node-id` | no | Anka Node ID (not name) to target for starting the VM |
| `vcpu` | no | The vCPUs to set before starting the Anka VM |
| `vram` | no | The ram to set before starting the Anka VM |

### Outputs

| output name | description |
| `action-id` | This is a unique action identifier, it will be set as an External ID in the VM Instance and also as a label on the created Github action runner |

## Usage

```yaml
jobs:
 
  action-up:
    runs-on: ubuntu-latest
    steps:
      - uses: veertuinc/anka-actions-up@v1
        id: action-up
        with:
          gh-pat: ${{ secrets.SERVICE_USER_PAT }}
          template-id: '9690461a-02b5-412d-8778-dab4167743db'
          controller-url: 'https://controller.mysite.com'
    outputs:
      action-id: ${{ steps.action-up.outputs.action-id }}

  inside_vm_job:
    needs: action-up
    runs-on: [ self-hosted, "${{ needs.action-up.outputs.action-id }}" ]
    steps:
      - name: Inside VM Job
        id: inside_vm_job
        run: |
          echo "running on runner inside of VM (${{ needs.action-up.outputs.action-id }})"
          echo "user: $USER"
          echo "home: $HOME"
          
  action_down:
    if: always()
    needs: [ action-up, inside_vm_job ]
    runs-on: ubuntu-latest
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          action-id: ${{ needs.action-up.outputs.action-id }}
          gh-pat: ${{ secrets.SERVICE_USER_PAT }}
          controller-url: 'https://controller.mysite.com'
```

### Authenticating using [Certificate Authentication](https://docs.veertu.com/anka/anka-build-cloud/advanced-security-features/certificate-authentication/)

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          controller-url: 'https://controller.mysite.com'
          controller-auth-cert-passphrase: 'secret'
          controller-auth-cert: ${{ secrets.CONTROLLER_CERT }}
          controller-auth-cert-key: ${{ secrets.CONTROLLER_KEY }}
          controller-https-skip-cert-verify: true # only needed if using self-signed cert for HTTPS/TLS
```

### Authenticating using [RTA (Root Token Auth)](https://docs.veertu.com/anka/anka-build-cloud/advanced-security-features/token-authentication/#protecting-your-cloud-with-rta-root-token-auth)

We do not recommend this as it exposes your root token. The root token has access to absolutely everything permissions-wise.

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          controller-url: 'https://controller.mysite.com'
          controller-root-token: ${{ secrets.ROOT_TOKEN }}
```

### Job TTL

The maximum seconds a job can run. If this TTL is reached it will stop and be marked as failed. It can be disabled with `0`. If not set, it will default to 5 minutes (300 seconds).

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          controller-url: 'https://controller.mysite.com'
          job-ttl: 300
```

### Controller HTTP Poll Delay

This is a interval between requests to your Anka Build Cloud Controller's REST API. It can be disabled with `0`. If not set, it will default to 5 minutes (300 seconds).

```yaml
    steps:
      - uses: veertuinc/anka-actions-down@v1
        with:
          . . .
          controller-http-poll-delay: 5
```

### Modifying the VM Template

```yaml
    steps:
      - uses: veertuinc/anka-actions-up@v1
        with:
          template-id: 'template id'
          template-tag: 'template tag'
          group-id: 'anka node group'
          node-id: 'anka node id'
          # NOTE: using "vcpu" and "vram" requires the stored template to be in stopped state
          vcpu: 'number of vCPUs to set for the VM'
          vram: 'amount of RAM in megabytes to set for the VM'
```
