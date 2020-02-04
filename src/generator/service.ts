import { Project, OptionalKind, MethodDeclarationStructure } from 'ts-morph'
import path from 'path'
import saveSourceFile from '../utils/saveSourceFile'

export function generateService(objectName: string, baseDirPath: string) {
  const modelName = objectName.charAt(0).toUpperCase() + objectName.slice(1)
  const project = new Project()
  const filePath = path.resolve(baseDirPath, 'generated', objectName, `${objectName}.service.ts`)

  // service 方法
  const methodTypes = [
    {
      name: 'findOne',
      paramType: `Query${modelName}Args`,
      returnType: `Promise<${modelName}>`,
      statments: `
        return await this.${objectName}Repository.findOne(params)
      `,
    },
    {
      name: 'findMany',
      paramType: `Query${modelName}sArgs`,
      returnType: `Promise<${modelName}[]>`,
      statments: `
        return await this.${objectName}Repository.findMany(params)
      `,
    },
    {
      name: 'count',
      paramType: `${modelName}AggregateArgs`,
      returnType: `Promise<number>`,
      statments: `
        return await this.${objectName}Repository.count(params)
      `,
    },

    {
      name: 'aggregate',
      paramType: `${modelName}AggregateArgs`,
      returnType: `Promise<${modelName}Aggregate>`,
      statments: `
        return await this.${objectName}Repository.aggregate(params)
      `,
    },

    {
      name: 'create',
      paramType: `Create${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      statments: `
        return await this.${objectName}Repository.create(params)
      `,
    },

    {
      name: 'update',
      paramType: `Update${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      statments: `
        return await this.${objectName}Repository.update(params)
      `,
    },

    {
      name: 'upsert',
      paramType: `Upsert${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      statments: `
        return await this.${objectName}Repository.upsert(params)
      `,
    },

    {
      name: 'delete',
      paramType: `Delete${modelName}Input`,
      returnType: `Promise<boolean>`,
      statments: `
        return await this.${objectName}Repository.delete(params)
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
  ])

  // import repository
  sourceFile.addImportDeclaration({
    moduleSpecifier: `./${objectName}.repository`,
    namedImports: [`${modelName}Repository`],
  })

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
    name: `${modelName}Service`,
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
            type: `${modelName}Repository`,
          },
        ],
      },
      ...methods,
    ],
  })

  saveSourceFile(sourceFile)
}
