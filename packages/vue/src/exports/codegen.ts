////////////////////////////////////////////////////////////////////////////////
// @wagmi/core/codegen
////////////////////////////////////////////////////////////////////////////////

// biome-ignore lint/performance/noBarrelFile: entrypoint module
// biome-ignore lint/performance/noReExportAll: entrypoint module
export * from '@wagmi/core/codegen'

////////////////////////////////////////////////////////////////////////////////
// Composables
////////////////////////////////////////////////////////////////////////////////

export {
  type CreateUseReadContractParameters,
  type CreateUseReadContractReturnType,
  createUseReadContract,
} from '../composables/codegen/createUseReadContract.js'

export {
  type CreateUseSimulateContractParameters,
  type CreateUseSimulateContractReturnType,
  createUseSimulateContract,
} from '../composables/codegen/createUseSimulateContract.js'

export {
  type CreateUseWatchContractEventParameters,
  type CreateUseWatchContractEventReturnType,
  createUseWatchContractEvent,
} from '../composables/codegen/createUseWatchContractEvent.js'

export {
  type CreateUseWriteContractParameters,
  type CreateUseWriteContractReturnType,
  createUseWriteContract,
} from '../composables/codegen/createUseWriteContract.js'
