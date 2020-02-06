import { Project, OptionalKind, MethodDeclarationStructure } from 'ts-morph'
import path from 'path'
import saveSourceFile from '../utils/saveSourceFile'

export function generateRepository(objectName: string, baseDirPath: string, relations: string) {
  const modelName = objectName.charAt(0).toUpperCase() + objectName.slice(1)
  const project = new Project()
  const filePath = path.resolve(baseDirPath, 'generated', objectName, `${objectName}.repository.ts`)

  // repository 方法
  const methodTypes = [
    {
      name: 'findOne',
      paramType: `Query${modelName}Args`,
      returnType: `Promise<${modelName}>`,
      statments: `
        const condition = { relations: ${relations}, where: params } as any
        const result = await this.${objectName}Repository.findOne(condition)
        if (result) return result
        throw new BadRequest('未找到对象')
      `,
    },
    {
      name: 'findMany',
      paramType: `Query${modelName}sArgs`,
      returnType: `Promise<${modelName}[]>`,
      statments: `
        const { where = {}, first: take, skip, orderBy = 'id_ASC' } = params
        const order = { [orderBy.split('_')[0]]: orderBy.split('_')[1] }
        const condition = { relations: ${relations}, where, take, skip, order } as any
        return await this.${objectName}Repository.find(condition)
      `,
    },
    {
      name: 'count',
      paramType: `${modelName}AggregateArgs`,
      returnType: `Promise<number>`,
      statments: `
        return await this.${objectName}Repository.count({ ...params.where } || {})
      `,
    },

    {
      name: 'aggregate',
      paramType: `${modelName}AggregateArgs`,
      returnType: `Promise<${modelName}Aggregate>`,
      statments: `
        return {
          count: await this.count(params),
        }
      `,
    },

    {
      name: 'create',
      paramType: `Create${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      statments: `
        return await this.${objectName}Repository.save(params)
      `,
    },

    {
      name: 'update',
      paramType: `Update${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      statments: `const { where = {}, data = {} } = params
        const result = await this.findOne(where)
        if (!result) throw new BadRequest('未找到要更新的对象')

        await this.${objectName}Repository.update(result.id, data)

        // 是否需要重新查数据库？
        return { ...result, ...data }
      `,
    },

    {
      name: 'upsert',
      paramType: `Upsert${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      statments: `
        const { where, update, create } = params
        try {
          await this.findOne(where)
          return await this.update({ where, data: update })
        } catch (error) {
          return await this.create(create)
        }
      `,
    },

    {
      name: 'delete',
      paramType: `Delete${modelName}Input`,
      returnType: `Promise<boolean>`,
      statments: `
        const result = await this.${objectName}Repository.delete(params)
        if (result.affected) return true
        throw new BadRequest('删除失败, 请检查删除条件是否正确')
      `,
    },
  ]

  const sourceFile = project.createSourceFile(filePath, undefined, {
    overwrite: true,
  })

  const methods: OptionalKind<MethodDeclarationStructure>[] = methodTypes.map(
    i =>
      ({
        name: i.name,
        isAsync: true,
        parameters: [
          {
            name: 'params',
            type: i.paramType,
          },
        ],
        returnType: i.returnType,
        statements: i.statments,
      } as OptionalKind<MethodDeclarationStructure>),
  )

  // import lib
  sourceFile.addImportDeclarations([
    { moduleSpecifier: '@tiejs/common', namedImports: ['Injectable'] },
    { moduleSpecifier: '@tiejs/typeorm', namedImports: ['InjectRepository'] },
    { moduleSpecifier: '@tiejs/exception', namedImports: ['BadRequest'] },
    { moduleSpecifier: 'typeorm', namedImports: ['Repository'] },
  ])

  // import model
  sourceFile.addImportDeclaration({
    moduleSpecifier: `@entity/${objectName}.entity`,
    namedImports: [modelName],
  })

  // import type
  sourceFile.addImportDeclaration({
    moduleSpecifier: `@${objectName}/${objectName}.type`,
    namedImports: [`${modelName}Aggregate`],
  })

  // import input
  sourceFile.addImportDeclaration({
    moduleSpecifier: `@${objectName}/${objectName}.input`,
    namedImports: [
      `Create${modelName}Input`,
      `Update${modelName}Input`,
      `Delete${modelName}Input`,
      `Upsert${modelName}Input`,
    ],
  })

  // import args
  sourceFile.addImportDeclaration({
    moduleSpecifier: `@${objectName}/${objectName}.args`,
    namedImports: [`Query${modelName}Args`, `Query${modelName}sArgs`, `${modelName}AggregateArgs`],
  })

  sourceFile.addClass({
    name: `${modelName}Repository`,
    isExported: true,
    decorators: [
      {
        name: 'Injectable',
        arguments: [],
      },
    ],
    methods: [
      {
        name: 'constructor',
        parameters: [
          {
            name: `private ${objectName}Repository`,
            type: `Repository<${modelName}>`,
            decorators: [{ name: 'InjectRepository', arguments: [modelName] }],
          },
        ],
      },
      ...methods,
    ],
  })

  saveSourceFile(sourceFile)
}
