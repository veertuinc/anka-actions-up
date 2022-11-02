import * as core from '@actions/core'
import {
  logDebug,
  logInfo,
  sleep,
  Runner,
  VM,
  StartVMRequest,
  INSTANCE_STATE_STARTED
} from 'anka-actions-common'

export type ActionParams = {
  ghOwner: string
  ghRepo: string
  ghPAT: string

  templateId: string
  templateTag?: string
  templateRunnerDir: string

  baseUrl: string

  rootToken?: string

  httpsAgentCa?: string
  httpsAgentCert?: string
  httpsAgentPassphrase?: string
  httpsAgentSkipCertVerify?: boolean
  httpsAgentKey?: string

  pollDelay: number
  hardTimeout: number

  vcpu?: number
  vram?: number
  group_id?: string
  node_id?: string
}

export async function doAction(
  actionId: string,
  runner: Runner,
  vm: VM,
  params: ActionParams
): Promise<void> {
  const token = await runner.createToken()
  const repoUrl = `https://github.com/${params.ghOwner}/${params.ghRepo}`

  const vmConfig: StartVMRequest = {
    count: 1,
    vmid: params.templateId,
    tag: params.templateTag,
    vcpu: params.vcpu,
    vram: params.vram,
    group_id: params.group_id,
    node_id: params.node_id,
    startup_script: Buffer.from(
      `cd ${params.templateRunnerDir} \
  && ./config.sh --url "${repoUrl}" --token "${token}" --labels "${actionId}" --runnergroup "Default" --name "${actionId}" --work "_work" \
  && ./svc.sh install \
  && ./svc.sh start`,
      'binary'
    ).toString('base64'),
    script_monitoring: true,
    script_fail_handler: 1,
    external_id: actionId
  }

  logInfo(
    `[VM] starting new instance with \u001b[40;1m External ID \u001b[33m${actionId} \u001b[0m`
  )
  const instanceId = await vm.start(
    actionId,
    repoUrl,
    token,
    params.templateRunnerDir,
    vmConfig
  )

  core.setOutput('action-id', actionId)

  let vmState
  logInfo(`[VM] waiting for the VM instance to start...`)
  do {
    vmState = await vm.getState(instanceId)
    if (vmState !== INSTANCE_STATE_STARTED) {
      await sleep(params.pollDelay * 1000)
    }
    logInfo(`[VM] state: ${vmState}`)
  } while (vmState !== INSTANCE_STATE_STARTED)

  let runnerId: number | null = null
  logInfo(`[Action Runner] waiting for the Github action runner to register...`)
  do {
    runnerId = await runner.getRunnerByName(actionId)
    if (runnerId === null) {
      logInfo(`[Action Runner] has not yet been registered`)
      await sleep(params.pollDelay * 1000)
    } else {
      logInfo(
        `[Action Runner] with \u001b[40;1m name \u001b[33m${actionId} \u001b[0m and \u001b[40;1m id \u001b[33m${runnerId} \u001b[0m has been registered`
      )
    }
  } while (runnerId === null)
}

export async function parseParams(): Promise<ActionParams> {
  const pollDelay: number = parseInt(
    core.getInput('poll-delay', {required: true}),
    10
  )
  if (isNaN(pollDelay) || pollDelay <= 0)
    throw new Error('poll-delay must be positive integer')

  const hardTimeout: number = parseInt(
    core.getInput('hard-timeout', {required: true}),
    10
  )
  if (isNaN(hardTimeout) || hardTimeout < 0)
    throw new Error('hard-timeout must be greater then or equal to 0')

  const ghOwner = core.getInput('gh-owner', {required: true})

  const params: ActionParams = {
    ghOwner,
    ghRepo: core
      .getInput('gh-repository', {required: true})
      .replace(`${ghOwner}/`, ''),
    ghPAT: core.getInput('gh-pat', {required: true}),

    templateId: core.getInput('template-id', {required: true}),
    templateRunnerDir: core.getInput('template-runner-dir', {
      required: true
    }),

    baseUrl: core.getInput('base-url', {required: true}),

    rootToken: core.getInput('root-token'),

    pollDelay,
    hardTimeout
  }

  const templateTag = core.getInput('template-tag')
  if (templateTag) {
    params.templateTag = templateTag
  }

  const httpsAgentCa = core.getInput('https-agent-ca')
  if (httpsAgentCa) {
    params.httpsAgentCa = httpsAgentCa
  }

  const httpsAgentCert = core.getInput('auth-cert')
  if (httpsAgentCert) {
    params.httpsAgentCert = httpsAgentCert
  }

  const httpsAgentKey = core.getInput('auth-cert-key')
  if (httpsAgentKey) {
    params.httpsAgentKey = httpsAgentKey
  }

  const httpsAgentPassphrase = core.getInput('auth-cert-passphrase')
  if (httpsAgentPassphrase) {
    params.httpsAgentPassphrase = httpsAgentPassphrase
  }

  const httpsAgentSkipCertVerify = core.getBooleanInput(
    'https-agent-skip-cert-verify'
  )
  if (httpsAgentSkipCertVerify) {
    params.httpsAgentSkipCertVerify = httpsAgentSkipCertVerify
  }

  const vcpu = core.getInput('vcpu')
  if (vcpu) {
    const vcpuNum = parseInt(vcpu, 10)
    if (isNaN(vcpuNum) || vcpuNum <= 0)
      throw new Error('vcpu must be positive integer')
    params.vcpu = vcpuNum
  }

  const vram = core.getInput('vram')
  if (vram) {
    const vramNum = parseInt(vram, 10)
    if (isNaN(vramNum) || vramNum <= 0)
      throw new Error('vram must be positive integer')
    params.vram = vramNum
  }

  const groupId = core.getInput('group-id')
  if (groupId) {
    params.group_id = groupId
  }

  const nodeId = core.getInput('node-id')
  if (nodeId) {
    params.node_id = nodeId
  }

  logDebug(`Parsed params: ${JSON.stringify(params)}`)
  return params
}
