# anka-actions-down
# Use cases

## Prerequesites

1. Install the github runner inside of your VM. This can be done with [our installation script](https://github.com/veertuinc/anka-actions-connect/blob/main/install.sh)
2. Add your Github [PAT](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) and add it to your repo under [https://github.com/{USER/ORG}/{REPONAME}/settings/secrets/actions]. Your PAT should have "repo" if using classic tokens. Also, the user with the PAT must be added as an Admin collaborator to the repository. Fine-grained are not supported at the time of writing this.

## Connecting to a controller
There are only 3 required parameters:
- `gh-pat` stand for Github personal access token (requires `repo` scope in order to be able to create/remove self-hosted runners in the repository).
- `base-url` is a base URL to Anka controller
- `template-id` is an Anka template id

The rest are optional! 

### Using unencrypted HTTP connection
```yaml
    steps:
      - uses: veertuinc/anka-actions-up@v1
        with:
          gh-pat: ${{ secrets.REPO_SCOPE_PAT }}
          base-url: 'http://192.168.1.1'
```

### Using HTTPS connection
#### Authenticating with trusted certificate
```yaml
    steps:
      - uses: veertuinc/anka-actions-up@v1
        with:
          # ...
          auth-cert: |
            -----BEGIN CERTIFICATE-----
            MIIETzCCAzegAwIBAgIUDQH+IYhuKajreldTnRo5Dh5hwzwwDQYJKoZIhvcNAQEL
            # ...
            IIf5XBR58a3PaS1aWN7krtPk1iUyPqo9VXG6GWInIcE/YJlYNeD5295IACzZ9Qmk
            a3oX
            -----END CERTIFICATE-----
          auth-cert-passphrase: 'secret'
          auth-cert-key: |
            -----BEGIN PRIVATE KEY-----
            MIIJQQIBADANBgkqhkiG9w0BAQEFAASCCSswggknAgEAAoICAQCrPCrZt+BD4Ka8
            # ...
            jyRTcs5idHg8FzX6BAyWo9do+sDt
            -----END PRIVATE KEY-----
```

#### Authenticating with self-signed certificates
This will also require specifying root certificate with `https-agent-ca:`
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ...
          https-agent-ca: ${{ secrets.YOUR_CERTIFICATE }}
```

#### Using self-signed certificates without authentication
If you do not use HTTPS authentication you could simply add `https-agent-skip-cert-verify: true` instead:
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ...
          https-agent-skip-cert-verify: true
```

## Authenticating with a root token
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ...
          root-token: ${{ secrets.ROOT_TOKEN }}
```

# Setting timeouts
## Hard timeout
Sometimes configured Anka instance will need to pull heavy template from the network (taking hours),
which is normal, but also there may be a situation when job hang up without a reason. In order to kill such
a job `hard-timeout` parameter is introduced. By default, it is set to `12 hours`. Once a job cant finish
within specified interval it will be stopped and marked as failed. You can disable this behaviour by setting it to `0`
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ... defaults to 12 hours
          hard-timeout: 43200
```

## Poll delay
This is a sleep interval between requests to your Anka controller REST API
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ... defaults to 5 seconds
          poll-delay: 5
```

### Setting VM options
Configuring VM template:
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          template-id: 'template id'
          template-tag: 'template tag'
          group-id: 'anka node group'
          node-id: 'anka node id'
          # NOTE: using "vcpu" and "vram" requires the stored template to be in stopped state
          vcpu: 'number of CPUs'
          vram: 'amount of RAM in megabytes'
```

In case you want to change default path where Github runner is stored within the template:
```yaml
    steps:
      - uses: veertuinc/anka-actions-up
        with:
          # ... Path within the Anka template where Github runner is installed
          template-runner-dir:
```