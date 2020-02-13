# Tie GraphQL Crud

GraphQL 增删改查自动化

## 用法

```js
import { generate } from './tie-graphql-crud'

generate('user', {
  relations: `['posts']`,
  excludes: ['user'],
})

generate('post', {
  relations: `['user']`,
  excludes: ['posts', 'updatePost'],
})
```
