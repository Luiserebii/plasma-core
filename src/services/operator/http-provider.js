const axios = require('axios')
const uuidv4 = require('uuid/v4')

const BaseOperatorProvider = require('./base-provider')

/**
 * Service that wraps the interface to the operator.
 */
class HttpOperatorProvider extends BaseOperatorProvider {
  constructor (options = {}) {
    super(options)
    this.http = axios.create({
      baseURL: options.url || 'http://localhost:9898'
    })
  }

  get name () {
    return 'http'
  }

  async _handle (method, params) {
    const rawResponse = await this.http.post('/', {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: uuidv4()
    })
    const response = JSON.parse(rawResponse.data)
    if (response.error) {
      throw response.error
    }
    return response.result
  }

  async getRangesByOwner (owner, startBlock) {
    return this._handle('op_getRangesByOwner', [owner, startBlock])
  }

  async getTransactionHistory (transaction, startBlock) {
    return this._handle('op_getTxHistory', [transaction, startBlock])
  }

  async sendTransaction (transaction) {
    return this._handle('op_sendTransaction', [transaction])
  }
}

module.exports = HttpOperatorProvider
