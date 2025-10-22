import { pascalCase } from 'change-case'

import type { Contract, Plugin } from '../config.js'
import type { Compute, RequiredBy } from '../types.js'
import { getAddressDocString } from '../utils/getAddressDocString.js'

export type VueConfig = {
  getComposableName?:
    | 'legacy' // TODO: Deprecate `'legacy'` option
    | ((options: {
        contractName: string
        itemName?: string | undefined
        type: 'read' | 'simulate' | 'watch' | 'write'
      }) => `use${string}`)
}

type VueResult = Compute<RequiredBy<Plugin, 'run'>>

export function vue(config: VueConfig = {}): VueResult {
  return {
    name: 'Vue',
    async run({ contracts }) {
      const imports = new Set<string>([])
      const content: string[] = []
      const pure = '/*#__PURE__*/'

      const composableNames = new Set<string>()
      for (const contract of contracts) {
        let hasReadFunction = false
        let hasWriteFunction = false
        let hasEvent = false
        const readItems = []
        const writeItems = []
        const eventItems = []
        for (const item of contract.abi) {
          if (item.type === 'function')
            if (
              item.stateMutability === 'view' ||
              item.stateMutability === 'pure'
            ) {
              hasReadFunction = true
              readItems.push(item)
            } else {
              hasWriteFunction = true
              writeItems.push(item)
            }
          else if (item.type === 'event') {
            hasEvent = true
            eventItems.push(item)
          }
        }

        let innerContent: string
        if (contract.meta.addressName)
          innerContent = `abi: ${contract.meta.abiName}, address: ${contract.meta.addressName}`
        else innerContent = `abi: ${contract.meta.abiName}`

        if (hasReadFunction) {
          const composableName = getComposableName(
            config,
            composableNames,
            'read',
            contract.name,
          )
          const docString = genDocString('useReadContract', contract)
          const functionName = 'createUseReadContract'
          imports.add(functionName)
          content.push(
            `${docString}
export const ${composableName} = ${pure} ${functionName}({ ${innerContent} })`,
          )

          const names = new Set<string>()
          for (const item of readItems) {
            if (item.type !== 'function') continue
            if (
              item.stateMutability !== 'pure' &&
              item.stateMutability !== 'view'
            )
              continue

            // Skip overrides since they are captured by same composable
            if (names.has(item.name)) continue
            names.add(item.name)

            const composableName = getComposableName(
              config,
              composableNames,
              'read',
              contract.name,
              item.name,
            )
            const docString = genDocString('useReadContract', contract, {
              name: 'functionName',
              value: item.name,
            })
            content.push(
              `${docString}
export const ${composableName} = ${pure} ${functionName}({ ${innerContent}, functionName: '${item.name}' })`,
            )
          }
        }

        if (hasWriteFunction) {
          {
            const composableName = getComposableName(
              config,
              composableNames,
              'write',
              contract.name,
            )
            const docString = genDocString('useWriteContract', contract)
            const functionName = 'createUseWriteContract'
            imports.add(functionName)
            content.push(
              `${docString}
export const ${composableName} = ${pure} ${functionName}({ ${innerContent} })`,
            )

            const names = new Set<string>()
            for (const item of writeItems) {
              if (item.type !== 'function') continue
              if (
                item.stateMutability !== 'nonpayable' &&
                item.stateMutability !== 'payable'
              )
                continue

              // Skip overrides since they are captured by same composable
              if (names.has(item.name)) continue
              names.add(item.name)

              const composableName = getComposableName(
                config,
                composableNames,
                'write',
                contract.name,
                item.name,
              )
              const docString = genDocString('useWriteContract', contract, {
                name: 'functionName',
                value: item.name,
              })
              content.push(
                `${docString}
export const ${composableName} = ${pure} ${functionName}({ ${innerContent}, functionName: '${item.name}' })`,
              )
            }
          }

          {
            const composableName = getComposableName(
              config,
              composableNames,
              'simulate',
              contract.name,
            )
            const docString = genDocString('useSimulateContract', contract)
            const functionName = 'createUseSimulateContract'
            imports.add(functionName)
            content.push(
              `${docString}
export const ${composableName} = ${pure} ${functionName}({ ${innerContent} })`,
            )

            const names = new Set<string>()
            for (const item of writeItems) {
              if (item.type !== 'function') continue
              if (
                item.stateMutability !== 'nonpayable' &&
                item.stateMutability !== 'payable'
              )
                continue

              // Skip overrides since they are captured by same composable
              if (names.has(item.name)) continue
              names.add(item.name)

              const composableName = getComposableName(
                config,
                composableNames,
                'simulate',
                contract.name,
                item.name,
              )
              const docString = genDocString('useSimulateContract', contract, {
                name: 'functionName',
                value: item.name,
              })
              content.push(
                `${docString}
export const ${composableName} = ${pure} ${functionName}({ ${innerContent}, functionName: '${item.name}' })`,
              )
            }
          }
        }

        if (hasEvent) {
          const composableName = getComposableName(
            config,
            composableNames,
            'watch',
            contract.name,
          )
          const docString = genDocString('useWatchContractEvent', contract)
          const functionName = 'createUseWatchContractEvent'
          imports.add(functionName)
          content.push(
            `${docString}
export const ${composableName} = ${pure} ${functionName}({ ${innerContent} })`,
          )

          const names = new Set<string>()
          for (const item of eventItems) {
            if (item.type !== 'event') continue

            // Skip overrides since they are captured by same composable
            if (names.has(item.name)) continue
            names.add(item.name)

            const composableName = getComposableName(
              config,
              composableNames,
              'watch',
              contract.name,
              item.name,
            )
            const docString = genDocString('useWatchContractEvent', contract, {
              name: 'eventName',
              value: item.name,
            })
            content.push(
              `${docString}
export const ${composableName} = ${pure} ${functionName}({ ${innerContent}, eventName: '${item.name}' })`,
            )
          }
        }
      }

      const importValues = [...imports.values()]

      return {
        imports: importValues.length
          ? `import { ${importValues.join(', ')} } from '@wagmi/vue/codegen'\n`
          : '',
        content: content.join('\n\n'),
      }
    },
  }
}

function genDocString(
  composableName: string,
  contract: Contract,
  item?: { name: string; value: string },
) {
  let description = `Wraps __{@link ${composableName}}__ with \`abi\` set to __{@link ${contract.meta.abiName}}__`
  if (item) description += ` and \`${item.name}\` set to \`"${item.value}"\``

  const docString = getAddressDocString({ address: contract.address })
  if (docString)
    return `/**
 * ${description}
 * 
 ${docString}
 */`

  return `/**
 * ${description}
 */`
}

function getComposableName(
  config: VueConfig,
  composableNames: Set<string>,
  type: 'read' | 'simulate' | 'watch' | 'write',
  contractName: string,
  itemName?: string | undefined,
) {
  const ContractName = pascalCase(contractName)
  const ItemName = itemName ? pascalCase(itemName) : undefined

  let composableName: string
  if (typeof config.getComposableName === 'function')
    composableName = config.getComposableName({
      type,
      contractName: ContractName,
      itemName: ItemName,
    })
  else if (typeof config.getComposableName === 'string') {
    switch (type) {
      case 'read':
        composableName = `use${ContractName}${ItemName ?? 'Read'}`
        break
      case 'simulate':
        composableName = `usePrepare${ContractName}${ItemName ?? 'Write'}`
        break
      case 'watch':
        composableName = `use${ContractName}${ItemName ?? ''}Event`
        break
      case 'write':
        composableName = `use${ContractName}${ItemName ?? 'Write'}`
        break
    }
  } else {
    composableName = `use${pascalCase(type)}${ContractName}${ItemName ?? ''}`
    if (type === 'watch') composableName = `${composableName}Event`
  }

  if (composableNames.has(composableName))
    throw new Error(
      `Composable name "${composableName}" must be unique for contract "${contractName}". Try using \`getComposableName\` to create a unique name.`,
    )

  composableNames.add(composableName)
  return composableName
}
