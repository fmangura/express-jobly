const { BadRequestError } = require("../expressError");

/** Handles partial changes to database 
 * 
 * { anydataCol: changes } => 
 * {setCols: anydataCol1, anydataCol..., values: changes}
 * Takes a (json-body-data, {js:sql} any col that may be *        written as json turn into SQL col )
 * 
 * Takes a (json-body-data, {js:sql} any col that may be        * written as json turn into SQL col )
 * 
 * This all can be done had we just used PUT /companies/:handle
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/** Handles turning obj from GET filter into its SQL query equivalent
 * {nameLike: 'string', minEmployees: 300} 
 *    => {'name ILIKE $1':'string', 'num_employees >= $2': 300}
 * 
 **** ONLY FOR COMPANY FILTER ****
 */

function sqlForPartialFilter(criteria) {

  if (criteria['minEmployees'] > criteria['maxEmployees']) {
    throw new BadRequestError("Filter request failed: min > max");
  }

  const keys = Object.keys(criteria);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {nameLike: 'baue', minEmployees: 300} => ['name ILIKE $1', 'num_employees > $2']

  const cols = keys.map((colName, idx) => {
    if (colName === 'nameLike') {
      return `name ILIKE $${idx + 1}`

    } else if (colName === 'minEmployees') {
      return `num_employees >= $${idx+1}`

    } else if (colName === 'maxEmployees') {
      return `num_employees <= $${idx+1}`

    } else {
      throw new BadRequestError("No data");
    }
  });

  return {
    sqlString: cols.join(" AND "),
    values: Object.values(criteria),
  };
}

/** converts query string of filter to proper value Type.
 *  
 *  {nameLike: 'string', minEmployees: '300'} => {nameLike: 'string', minEmployees: 300}
 * 
 * Also includes checking hasEquity for true or false and converting that 
 * into a usable values (true ? 0.1% : 0)
 * 
*/

function queryFilterConvert(queryString) {
  const qString = {}
  Object.entries(queryString).forEach(([key, value]) => {
    if (key == 'minEmployees' || key == 'maxEmployees' || key == 'minSalary'){
      let newVal = Number(value);
      qString[key] = newVal;

    } else if (key == 'hasEquity'){
      let newVal = (value == 'true') ? 0.0001 : 0;
      qString[key] = newVal;

    } else {
      qString[key] = `%${value}%`;
    }
  });
  return qString;
};

/** Handles turning obj from GET filter into its SQL query equivalent
 * {title: 'string', minSalary: 300} 
 *    => {'title ILIKE $1':'string', 'salary >= $2': 300}
 * 
 **** ONLY FOR JOB FILTER ****
 */

function sqlForJobFilter(criteria) {

  const keys = Object.keys(criteria);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {title: 'baue', minSalary: 300} => ['name ILIKE $1', 'minSalary >= $2']

  const cols = keys.map((colName, idx) => {
    if (colName === 'title') {
      return `title ILIKE $${idx + 1}`

    } else if (colName === 'minSalary') {
      return `salary >= $${idx+1}`

    } else if (colName === 'hasEquity') {
      return `equity >= $${idx+1}`

    } else {
      throw new BadRequestError("No data");
    }
  });

  return {
    sqlString: cols.join(" AND "),
    values: Object.values(criteria),
  };
}

module.exports = { 
    sqlForPartialUpdate, 
    sqlForPartialFilter, 
    queryFilterConvert,
    sqlForJobFilter };
