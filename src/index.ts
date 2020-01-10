import { tableToTS } from './typescript'
import { MySQL } from './mysql-client'
import prettier from 'prettier'
import pkg from '../package.json'

function pretty(code: string): string {
  return prettier.format(code, {
    parser: 'typescript',
    ...pkg.prettier
  })
}

const JSONHeader = `
export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONObject = { [member: string]: JSONValue };
export interface JSONArray extends Array<JSONValue> {}
`

const header = (includesJSON: boolean): string => `
/**
 Schema Generated with ${pkg.name} ${pkg.version}
*/

${includesJSON ? JSONHeader : ''}
`

export async function inferTable(connectionString: string, table: string): Promise<string> {
  const db = new MySQL(connectionString)
  const code = tableToTS(table, await db.table(table))
  const fullCode = `
    ${header(code.includes('JSON'))}
    ${code}
  `
  return pretty(fullCode)
}

export async function inferSchema(connectionString: string): Promise<string> {
  const db = new MySQL(connectionString)
  const tables = await db.allTables()
  const interfaces = tables.map(table => tableToTS(table.name, table.table))
  const code = [header(interfaces.some(i => i.includes('JSON'))), ...interfaces].join('\n')
  return pretty(code)
}
