import {expect, jest, test} from '@jest/globals'
import {getBooleanInput, getInput} from '@actions/core'
import {parseParams} from '../src/action'

jest.mock('@actions/core')

const mockedGetInput = <jest.Mock<typeof getInput>>getInput
const mockedGetBooleanInput = <jest.Mock<typeof getBooleanInput>>getBooleanInput

beforeEach(() => {
  jest.clearAllMocks()
})

test('parse all parameters', async () => {
  mockedGetBooleanInput.mockImplementation((name: string, attr) => {
    switch (name) {
      default:
        return false
      case 'controller-https-skip-cert-verify':
        return true
    }
  })

  mockedGetInput.mockImplementation((name, attr) => {
    switch (name) {
      default:
        return name
      case 'controller-http-poll-delay':
        return '1'
      case 'job-ttl':
        return '2'
      case 'vcpu':
        return '3'
      case 'vram':
        return '4'
    }
  })
  const params = await parseParams()
  expect(params).toEqual({
    ghOwner: 'gh-owner',
    ghRepo: 'gh-repository',
    ghBaseUrl: 'gh-base-url',
    ghPAT: 'gh-pat',
    templateId: 'template-id',
    templateRunnerDir: 'template-runner-dir',
    baseUrl: 'controller-url',
    rootToken: 'controller-root-token',
    pollDelay: 1,
    hardTimeout: 2,
    templateTag: 'template-tag',
    httpsAgentCa: 'controller-tls-ca',
    httpsAgentCert: 'controller-auth-cert',
    httpsAgentKey: 'controller-auth-cert-key',
    httpsAgentPassphrase: 'controller-auth-cert-passphrase',
    httpsAgentSkipCertVerify: true,
    vcpu: 3,
    vram: 4,
    group_id: 'group-id',
    node_id: 'node-id'
  })
})

test('parse pollDelay throws', async () => {
  mockedGetInput.mockImplementation((name, attr) => {
    switch (name) {
      default:
        return name
      case 'job-ttl':
        return '2'
    }
  })
  expect(parseParams()).rejects.toThrowError(
    'controller-http-poll-delay must be positive integer'
  )
})

test('parse hardTimeout throws', async () => {
  mockedGetInput.mockImplementation((name, attr) => {
    switch (name) {
      default:
        return name
      case 'controller-http-poll-delay':
        return '1'
    }
  })
  expect(parseParams()).rejects.toThrowError(
    'job-ttl must be greater then or equal to 0'
  )
})

test('parse vcpu throws', async () => {
  mockedGetInput.mockImplementation((name, attr) => {
    switch (name) {
      default:
        return name
      case 'controller-http-poll-delay':
        return '1'
      case 'job-ttl':
        return '2'
      case 'vcpu':
        return '0'
    }
  })
  expect(parseParams()).rejects.toThrowError('vcpu must be positive integer')
})

test('parse vram throws', async () => {
  mockedGetInput.mockImplementation((name, attr) => {
    switch (name) {
      default:
        return ''
      case 'controller-http-poll-delay':
        return '1'
      case 'job-ttl':
        return '2'
      case 'vram':
        return '0'
    }
  })
  expect(parseParams()).rejects.toThrowError('vram must be positive integer')
})
