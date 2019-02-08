const services = require('./services/index')
const debug = require('debug')

<<<<<<< 2655095e337ac1a795fdd31775ded14bb03edc5f
const defaultOptions = {
  dbProvider: services.DBProviders.DefaultDBProvider,
  operatorProvider: services.OperatorProviders.DefaultOperatorProvider,
  walletProvider: services.WalletProviders.DefaultWalletProvider,
  contractProvider: services.ContractProviders.DefaultContractProvider,
  web3Provider: services.Web3Provider
=======
const DefaultDBProvider = services.DBProviders.DefaultDBProvider
const DefaultOperatorProvider =
  services.OperatorProviders.DefaultOperatorProvider
const DefaultWalletProvider = services.WalletProviders.DefaultWalletProvider
const DefaultContractProvider =
  services.ContractProviders.DefaultContractProvider
const JSONRPCService = services.JSONRPCService
const ChainService = services.ChainService
const RangeManagerService = services.RangeManagerService
const SyncService = services.SyncService
const ProofService = services.ProofService
const Web3Provider = services.Web3Provider
const EventWatcherService = services.EventWatcherService
// Should this perhaps belong somewhere in ./services/ as a proper js file, or perhaps being a minor variable, here should suffice?
const defaultRegistryAddress = '0xA1f90e4933F9AF055e4a309DB54316552E7Fd10c'

const defaultOptions = {
  dbProvider: DefaultDBProvider,
  operatorProvider: DefaultOperatorProvider,
  walletProvider: DefaultWalletProvider,
  contractProvider: DefaultContractProvider,
  web3Provider: Web3Provider,
  registryAddress: defaultRegistryAddress
>>>>>>> Shifted defaultRegistryAddress into plasma.js defaultOptions. Moved out constants not related to outside sources, changed initContract to reflect these edits
}

/**
 * Main class that runs and manages all services.
 */
class Plasma {
  constructor (options = {}) {
    this.options = Object.assign({}, defaultOptions, options)

    if (this.options.debug) {
      debug.enable(this.options.debug)
    }

    this.services = {}
    this._loggers = {}
    this._registerServices()
  }

  /**
   * Proxy object that creates a new logger if
   * trying to access a logger that doesn't exist yet.
   * @return {Object} Mapping of available loggers.
   */
  get loggers () {
    return new Proxy(this._loggers, {
      get: (obj, prop) => {
        if (!(prop in obj)) {
          obj[prop] = debug(prop)
        }
        return obj[prop]
      }
    })
  }

  /**
   * Registers a single service to the app.
   * @param {*} Service Class of the service to register.
   * @param {*} options Any additional options.
   */
  registerService (Service, options = {}) {
    let service = Service

    // Check if it's a class or an instance of the class.
    if (typeof Service === 'function') {
      const appInject = { app: this }
      service = new Service({ ...options, ...appInject })
    } else {
      service.app = this
    }

    this.services[service.name] = service
  }

  /**
   * Registers all services.
   */
  _registerServices () {
    const available = [
      this.options.web3Provider,
      this.options.dbProvider,
      services.ChainDB,
      services.SyncDB,
      this.options.walletProvider,
      this.options.operatorProvider,
      this.options.contractProvider,
      services.ProofService,
      services.ChainService,
      services.JSONRPCService,
      services.EventWatcher,
      services.EventHandler,
      services.SyncService
    ]

    for (let service of available) {
      this.registerService(service, this.options)
    }
  }

  /**
   * Starts a single service.
   * @param {*} name Name of the service to start.
   */
  async startService (name) {
    if (!(name in this.services)) {
      throw new Error(`ERROR: Service does not exist: ${name}`)
    }

    const service = this.services[name]

    for (let dependency of service.dependencies) {
      if (!this.services[dependency] || !this.services[dependency].started) {
        throw new Error(
          `ERROR: Service ${name} is dependent on service that has not been started: ${dependency}`
        )
      }
    }

    service
      .start()
      .then(() => {
        this.loggers['core:bootstrap'](`${service.name}: STARTED`)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  /**
   * Stops a single service.
   * @param {*} name Name of the service to stop.
   */
  async stopService (name) {
    let service = this.services[name]
    service
      .stop()
      .then(() => {
        this.loggers['core:bootstrap'](`${service.name}: STOPPED`)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  /**
   * Starts all available services.
   */
  async start () {
    for (let service in this.services) {
      await this.startService(service)
    }
  }

  /**
   * Stops all available services.
   */
  async stop () {
    for (let service in this.services) {
      await this.stopService(service)
    }
  }
}

module.exports = Plasma
