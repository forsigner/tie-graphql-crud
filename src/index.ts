import { generateResolver } from './generator/resolver'
import { generateRepository } from './generator/repository'
import { generateService } from './generator/service'
import { Options } from './types'

export { generateResolver, generateRepository, generateService }

export function generate(objectName: string, options: Options) {
  generateRepository(objectName, options)
  generateService(objectName, options)
  generateResolver(objectName, options)
}
