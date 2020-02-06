import { generateResolver } from './generator/resolver'
import { generateRepository } from './generator/repository'
import { generateService } from './generator/service'

export { generateResolver, generateRepository, generateService }

export function generate(objectName: string, relations: string) {
  const baseDirPath = process.cwd()
  generateRepository(objectName, baseDirPath, relations)
  generateService(objectName, baseDirPath)
  generateResolver(objectName, baseDirPath)
}
