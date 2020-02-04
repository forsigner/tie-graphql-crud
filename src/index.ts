import { generateResolver } from './generator/resolver'
import { generateRepository } from './generator/repository'
import { generateService } from './generator/service'

export { generateResolver, generateRepository, generateService }

export function generate(objectName: string) {
  const baseDirPath = process.cwd()
  generateRepository(objectName, baseDirPath)
  generateService(objectName, baseDirPath)
  generateResolver(objectName, baseDirPath)
}
