import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'
import crypto from 'crypto'
import {parseParams, doAction} from './action'
import {
  Runner,
  timeout,
  HardTimeoutError,
  VM,
  logDebug
} from 'anka-actions-common'
;(async function main(): Promise<void> {
  try {
    const actionId = crypto.randomUUID()
    const params = await parseParams()
    const runner = new Runner(
      new Octokit({auth: params.ghPAT, baseUrl: params.ghBaseUrl}),
      params.ghOwner,
      params.ghRepo
    )
    logDebug(`runner: ${JSON.stringify(runner)}`)
    const vm = new VM(
      params.baseUrl,
      params.rootToken,
      params.httpsAgentCa,
      params.httpsAgentCert,
      params.httpsAgentKey,
      params.httpsAgentPassphrase,
      params.httpsAgentSkipCertVerify
    )
    if (params.hardTimeout > 0) {
      await Promise.race([
        timeout(params.hardTimeout * 1000, 'job-ttl exceeded'),
        doAction(actionId, runner, vm, params)
      ])
    } else {
      await doAction(actionId, runner, vm, params)
    }
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    logDebug(`${JSON.stringify(error)}`)

    core.setFailed(message)

    if (error instanceof HardTimeoutError) {
      process.exit(1)
    }
  }
})()
