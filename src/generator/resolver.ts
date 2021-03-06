import { Project, OptionalKind, MethodDeclarationStructure } from 'ts-morph'
import path from 'path'
import saveSourceFile from '../utils/saveSourceFile'
import { Options } from '../types'

export function generateResolver(objectName: string, options: Options) {
  const { baseDirPath = process.cwd(), excludes = [], moduleDir = `@${objectName}` } = options
  const modelName = objectName.charAt(0).toUpperCase() + objectName.slice(1)
  const project = new Project()
  const filePath = path.resolve(baseDirPath, 'generated', objectName, `${objectName}.resolver.ts`)

  // resolver 方法
  const methodTypes = [
    {
      name: `${objectName}`,
      type: 'Query',
      gqlType: `${modelName}`,
      paramtype: `Query${modelName}Args`,
      returnType: `Promise<${modelName}>`,
      desc: '获取单个',
      method: 'findOne',
    },
    {
      name: `${objectName}s`,
      type: 'Query',
      gqlType: `[${modelName}]`,
      paramtype: `Query${modelName}sArgs`,
      returnType: `Promise<${modelName}[]>`,
      desc: '获取列表',
      method: 'findMany',
    },

    {
      name: `${objectName}Aggregate`,
      type: 'Query',
      gqlType: `${modelName}Aggregate`,
      paramtype: `${modelName}AggregateArgs`,
      returnType: `Promise<${modelName}Aggregate>`,
      desc: '聚合查询',
      method: 'aggregate',
    },

    {
      name: `create${modelName}`,
      type: 'Mutation',
      gqlType: `${modelName}`,
      paramtype: `Create${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      desc: '创建',
      method: 'create',
    },

    {
      name: `update${modelName}`,
      type: 'Mutation',
      gqlType: `${modelName}`,
      paramtype: `Update${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      desc: '更新单个',
      method: 'update',
    },

    // TODO
    {
      name: `updateMany${modelName}s`,
      type: 'Mutation',
      gqlType: `${modelName}`,

      paramtype: `UpdateMany${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      desc: '批量更新',
      method: 'update',
    },

    {
      name: `upsert${modelName}`,
      type: 'Mutation',
      gqlType: `${modelName}`,
      paramtype: `Upsert${modelName}Input`,
      returnType: `Promise<${modelName}>`,
      desc: '更新或创建',
      method: 'upsert',
    },

    {
      name: `delete${modelName}`,
      type: 'Mutation',
      gqlType: 'Boolean',
      paramtype: `Delete${modelName}Input`,
      returnType: `Promise<boolean>`,
      desc: '删除单个',
      method: 'delete',
    },
  ]

  const sourceFile = project.createSourceFile(filePath, undefined, {
    overwrite: true,
  })

  const methods: OptionalKind<MethodDeclarationStructure>[] = methodTypes
    .filter(item => !excludes.includes(item.name))
    .map(
      i =>
        ({
          name: i.name,
          isAsync: true,
          returnType: i.returnType,
          decorators: [
            {
              name: i.type,
              arguments: [
                `() => ${i.gqlType}`,
                `{
              description: '${i.desc}' 
            }`,
              ],
            },
          ],
          parameters: [
            {
              name: 'args',
              type: i.paramtype,
              decorators: [
                {
                  name: i.type === 'Query' ? 'Args' : 'Arg',
                  arguments: [i.type === 'Query' ? '' : '"input"'],
                },
              ],
            },
          ],
          statements: `
          return await this.${objectName}Service.${i.method}(args)
        `,
        } as OptionalKind<MethodDeclarationStructure>),
    )

  // import lib
  sourceFile.addImportDeclarations([
    {
      moduleSpecifier: 'type-graphql',
      namedImports: ['Resolver', 'Query', 'Mutation', 'Arg', 'Args'],
    },
  ])

  // import service
  sourceFile.addImportDeclaration({
    moduleSpecifier: `./${objectName}.service`,
    namedImports: [`${modelName}CrudService`],
  })

  // import model
  sourceFile.addImportDeclaration({
    moduleSpecifier: `@entity/${objectName}.entity`,
    namedImports: [modelName],
  })

  // import type
  sourceFile.addImportDeclaration({
    moduleSpecifier: `${moduleDir}/${objectName}.type`,
    namedImports: [`${modelName}Aggregate`],
  })

  // import args
  sourceFile.addImportDeclaration({
    moduleSpecifier: `${moduleDir}/${objectName}.args`,
    namedImports: methodTypes
      .filter(i => i.type === 'Query' && !excludes.includes(i.name))
      .map(i => i.paramtype),
  })

  // import input
  sourceFile.addImportDeclaration({
    moduleSpecifier: `${moduleDir}/${objectName}.input`,
    namedImports: methodTypes
      .filter(i => i.type === 'Mutation' && !excludes.includes(i.name))
      .map(i => i.paramtype),
  })

  sourceFile.addClass({
    name: `${modelName}CrudResolver`,
    isExported: true,
    decorators: [
      {
        name: 'Resolver',
        arguments: [`() => ${modelName}`],
      },
    ],
    methods: [
      {
        name: 'constructor',
        parameters: [
          {
            name: `private ${objectName}Service`,
            type: `${modelName}CrudService`,
          },
        ],
      },
      ...methods,
    ],
  })

  saveSourceFile(sourceFile)
}
