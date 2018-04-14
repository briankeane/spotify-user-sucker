const errors = {
  DEFAULTS_EMPTY: 'Defaults cannot be empty',
  DATA_EMPTY: 'Data cannot be empty',
  ENTITY_DOES_NOT_EXIST: 'Row does not exist',
  FIELD_ALREADY_EXISTS: 'Field already exists',
  TABLE_NOT_SPECIFIED: 'Table not specified',
}

class JoinCondition {
  constructor(table1JoinField, table2JoinField, isEqual) {
    this.isEqual = isEqual
    this.table1JoinField = table1JoinField
    this.table2JoinField = table2JoinField
  }
}

function addFieldWithIDToEntityWithID(
  db,
  fieldID,
  field,
  entityID,
  entity,
  columns,
  table,
  fieldAlreadyExistsError = errors.FIELD_ALREADY_EXISTS,
  entityNotFoundError = errors.ENTITY_DOES_NOT_EXIST,
) {
  return new Promise((resolve, reject) => {
    db
      .oneOrNone(
        `insert into ${table} (${entity}, ${field}) select ${entityID}, ${fieldID} ` +
          `where not exists ` +
          `(select id from ${table} where ${entity} = ${entityID} and ${field} = ${fieldID}) ` +
          `returning ${columns}`,
      )
      .then(row => {
        if (!row) {
          reject(new Error(fieldAlreadyExistsError))
        } else {
          resolve(row)
        }
      })
      .catch(error => {
        if (parseInt(error.code) === 23503) {
          reject(new Error(entityNotFoundError))
        } else {
          reject(error)
        }
      })
  })
}

function create(db, defaults = {}, data = {}, columns = 'id', table) {
  return new Promise((resolve, reject) => {
    if (!defaults || Object.keys(defaults).length === 0) {
      reject(new Error(errors.DEFAULTS_EMPTY))
      return
    }

    if (!data || Object.keys(data).length === 0) {
      reject(new Error(errors.DATA_EMPTY))
      return
    }

    if (!table || table.length === 0) {
      reject(new Error(errors.TABLE_NOT_SPECIFIED))
      return
    }

    const defaultFields = Object.keys(defaults)
    const fields = defaultFields.join(', ')
    const values = defaultFields.map(f => `\${${f}}`).join(', ')
    data = Object.assign(defaults, data)
    db
      .one(
        `insert into ${table} (${fields}) values (${values}) returning ${columns}`,
        data,
      )
      .then(row => resolve(row))
      .catch(error => reject(error))
  })
}

function getWithID(
  db,
  id,
  columns = 'id',
  table,
  notFoundError = errors.ENTITY_DOES_NOT_EXIST,
) {
  return getWithFieldID(db, id, 'id', columns, table, notFoundError)
}

function getMany(
  db,
  columns,
  table,
  orderByField,
  sortOrder = 'asc',
  offset = 0,
  limit = 25,
) {
  return new Promise((resolve, reject) => {
    if (!table) {
      reject(new Error(errors.TABLE_NOT_SPECIFIED))
      return
    }

    db
      .manyOrNone(
        `select ${columns} from ${table} ` +
          `order by ${orderByField} ${sortOrder} ` +
          `offset ${offset} limit ${limit}`,
      )
      .then(rows => resolve(rows))
      .catch(error => reject(error))
  })
}

function getManyWithIDs(db, ids, columns = 'id', table) {
  return getManyWithFieldIDs(db, ids, 'id', columns, table)
}

function getWithFieldID(
  db,
  fieldID,
  field,
  columns,
  table,
  notFoundError = errors.ENTITY_DOES_NOT_EXIST,
) {
  return new Promise((resolve, reject) => {
    if (!table) {
      reject(new Error(errors.TABLE_NOT_SPECIFIED))
      return
    }

    const data = {}
    data[field] = fieldID
    db
      .oneOrNone(
        `select ${columns} from ${table} where ${field}=\${${field}}`,
        data,
      )
      .then(row => (row ? resolve(row) : reject(new Error(notFoundError))))
      .catch(error => reject(error))
  })
}

function getManyWithFieldIDs(db, fieldIDs, field, columns, table) {
  return new Promise((resolve, reject) => {
    if (fieldIDs === null || fieldIDs.length === 0) {
      resolve([])
      return
    }

    /**
     * The query we're using for the batch method does not allow specifying
     * the column namespace so we need to remove those
     */
    const fieldWithoutTable = field.replace(new RegExp(`${table}.`), '')
    const columnsWithoutTable = columns.replace(
      new RegExp(`${table}.`, 'g'),
      '',
    )

    /**
     * Right now we're handling removing duplicates on the JS side. I searched around
     * for a way to do this gracefully with Postgres, but it seems really inconsistent
     * and complicated. If there's a better way to do this in Postgres please
     * let me know!
     */
    const uniqueIDs = fieldIDs.filter(
      (elem, index, self) => index === self.indexOf(elem),
    )
    db
      .manyOrNone(
        `select ${columnsWithoutTable} ` +
          `from ${table} inner join unnest($1) with ordinality as f(field_id, idx) ` +
          `on field_id = ${fieldWithoutTable} order by idx`,
        [uniqueIDs],
      )
      .then(rows => resolve(rows))
      .catch(error => reject(error))
  })
}

function getManyInnerJoinedByFieldID(
  db,
  fieldID,
  table1,
  table1Field,
  table1JoinField,
  table2,
  table2JoinField,
  table2Columns,
  orderByField,
  sortOrder = 'asc',
  offset = 0,
  limit = 25,
) {
  const joinConditions = [
    new JoinCondition(table1JoinField, table2JoinField, true),
  ]
  return getManyInnerJoinedByFieldIDUsingJoinConditions(
    db,
    fieldID,
    joinConditions,
    table1,
    table1Field,
    table2,
    table2Columns,
    orderByField,
    sortOrder,
    offset,
    limit,
  )
}

function getManyInnerJoinedByFieldIDUsingJoinConditions(
  db,
  fieldID,
  joinConditions,
  table1,
  table1Field,
  table2,
  table2Columns,
  orderByField,
  sortOrder = 'asc',
  offset = 0,
  limit = 25,
) {
  let joins = ''
  for (let condition of joinConditions) {
    const table1JoinField = condition.table1JoinField
    const table2JoinField = condition.table2JoinField
    const isEqual = condition.isEqual
    joins += `${table1JoinField} ${isEqual
      ? '='
      : '!='} ${table2JoinField} and `
  }
  joins = joins.slice(0, -5)
  return db.manyOrNone(
    `select ${table2Columns} from ${table1} ` +
      `inner join ${table2} on (${joins}) ` +
      `where ${table1Field} = ${fieldID} ` +
      `order by ${orderByField} ${sortOrder} ` +
      `offset ${offset} limit ${limit}`,
  )
}

function getManyWithFieldID(
  db,
  fieldID,
  field,
  columns,
  table,
  orderByField,
  sortOrder = 'asc',
  offset = 0,
  limit = 25,
) {
  return new Promise((resolve, reject) => {
    if (!table) {
      reject(new Error(errors.TABLE_NOT_SPECIFIED))
      return
    }

    db
      .manyOrNone(
        `select ${columns} from ${table} ` +
          `where ${field}=${fieldID} ` +
          `order by ${orderByField} ${sortOrder} ` +
          `offset ${offset} limit ${limit}`,
      )
      .then(rows => resolve(rows))
      .catch(error => reject(error))
  })
}

function replaceFieldsWithIDsForEntityWithID(
  db,
  fieldIDs,
  field,
  entityID,
  entityField,
  columns,
  table,
) {
  return new Promise((resolve, reject) => {
    if (!entityID) {
      resolve([])
      return
    }

    db
      .tx(t => {
        let queries = []

        /**
         * Delete all existing fields matching ID
         */
        queries.push(
          t.result(`delete from ${table} where ${entityField} = ${entityID}`),
        )

        /**
         * Add these new fields
         */
        if (fieldIDs && fieldIDs.length) {
          queries.push(
            t.manyOrNone(
              `insert into ${table} (${entityField}, ${field}) ` +
                `values(${entityID}, unnest($1)) on conflict do nothing ` +
                `returning ${columns}`,
              [fieldIDs],
            ),
          )
        }

        return t.batch(queries)
      })
      .then(
        data =>
          !fieldIDs || fieldIDs.length === 0 ? resolve([]) : resolve(data[1]),
      )
      .catch(error => reject(error.first))
  })
}

function removeWithFieldID(
  db,
  fieldID,
  field,
  table,
  notFoundError = errors.ENTITY_DOES_NOT_EXIST,
) {
  const fields = {}
  fields[field] = fieldID
  return removeWithFieldIDs(db, fields, table, notFoundError)
}

function removeWithFieldIDs(
  db,
  fields,
  table,
  notFoundError = errors.ENTITY_DOES_NOT_EXIST,
) {
  return new Promise((resolve, reject) => {
    if (!table) {
      reject(new Error(errors.TABLE_NOT_SPECIFIED))
      return
    }

    let where = ''
    Object.keys(fields).map(key => (where += `${key} = \${${key}} and `))
    ;(where = where.slice(0, -5)),
      db
        .result(`delete from ${table} where ${where}`, fields)
        .then(
          data =>
            data.rowCount !== 0
              ? resolve(data)
              : reject(new Error(notFoundError)),
        )
        .catch(error => reject(error))
  })
}

function removeWithID(
  db,
  id,
  table,
  notFoundError = errors.ENTITY_DOES_NOT_EXIST,
) {
  return removeWithFieldID(db, id, 'id', table, notFoundError)
}

function updateWithID(
  db,
  id,
  allowedFields = [],
  data = {},
  columns = 'id',
  table,
) {
  return new Promise((resolve, reject) => {
    if (!data || Object.keys(data).length === 0) {
      reject(new Error(errors.DATA_EMPTY))
      return
    }

    if (!table || table.length === 0) {
      reject(new Error(errors.TABLE_NOT_SPECIFIED))
      return
    }

    const allowedData = {}
    for (let allowedField of allowedFields) {
      if (allowedField === 'updated_at') {
        allowedData[allowedField] = 'now()'
      } else if (data.hasOwnProperty(allowedField)) {
        allowedData[allowedField] = data[allowedField]
      }
    }

    let updates = ''
    Object.keys(allowedData).map(key => (updates += `${key} = \${${key}}, `))
    updates = updates.slice(0, -2)
    db
      .one(
        `update ${table} set ${updates} where id = ${id} returning ${columns}`,
        allowedData,
      )
      .then(row => resolve(row))
      .catch(error => reject(error))
  })
}

module.exports = {
  //
  // Errors
  //
  errors,

  //
  // Methods
  //
  addFieldWithIDToEntityWithID,
  create,
  getWithID,
  getMany,
  getManyWithIDs,
  getWithFieldID,
  getManyWithFieldIDs,
  getManyInnerJoinedByFieldID,
  getManyInnerJoinedByFieldIDUsingJoinConditions,
  getManyWithFieldID,
  replaceFieldsWithIDsForEntityWithID,
  removeWithFieldID,
  removeWithFieldIDs,
  removeWithID,
  updateWithID,

  //
  // Classes
  //
  JoinCondition,
}
