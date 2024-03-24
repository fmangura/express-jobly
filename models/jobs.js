"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForPartialFilter, queryFilterConvert, sqlForJobFilter } = require("../helpers/sql");

/** Related functions for jobs. */

class Jobs {
    /** Create a job (from data), update db, return new job data.
     * 
     * Data should be { title, salary, equity, company_handle }
     * 
     * Returns { title, salary, equity, company_handle }
     * 
     */

    static async create({ title, salary, equity, company_handle }){
        const company = await db.query(
            `SELECT handle
            FROM companies
            WHERE handle = $1`,
            [company_handle]
        )

        if(!company.rows[0]) throw new NotFoundError('Company Not Found');

        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING title, salary, equity, company_handle`,
            [title, salary, equity, company_handle],
        );

        const jobs = result.rows[0];
        return jobs;
    };

    /** Finds all jobs in order of company name.
     * 
     * Returns [{ title, salary, equity, company }, ...]
     */

    static async findAll() {
        const results = await db.query(
              `SELECT j.title,
                      j.salary,
                      j.equity,
                      c.name as company
               FROM jobs as j
               LEFT JOIN companies as c 
               ON j.company_handle = c.handle
               ORDER BY id`);
        return results.rows;
    }

    /** Given a job id, return data about the job. 
     * 
     * Returns { title, salary, equity, company }
    */
    static async get(id) {
    const results = await db.query(
        `SELECT j.title,
                    j.salary,
                    j.equity,
                    c.name as company
            FROM jobs as j
            LEFT JOIN companies as c 
            ON j.company_handle = c.handle
            WHERE j.id = $1`,
            [id]
        );
    
    if (!results.rows[0]) throw new NotFoundError(`No job id: ${id}`)
    return results.rows[0];
    };

    /** Update job by id.
     * 
     * This is a "partial update" just like the update to company data.
     * 
     * Returns {title, salary, equity, company}
     * 
     * Throws NotFoundError if not found
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {});
        
        const idVarIdx = "$" + (values.length + 1);

        const querySql =`UPDATE jobs
                         SET ${setCols}
                         WHERE id = ${idVarIdx}
                         RETURNING title,
                                    salary,
                                    equity,
                                    company_handle`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError( `No job with this id: ${id}`);

        return job;
    }

    /** Delete job given an id; returns undefined.
     * 
     * Throws NotFoundError if not found.
     */

    static async remove(id) {
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
        return job;
    }


  /** Finds jobs based on given criteria:
   *    title=String, minSalary=integer, hasEquity=boolean
   * 
   * By:
   * - converting obj values from route data to correct Types
   *        - hasEquity if true is set as equity >= 0.1%
   *        - if false is set as equity >= 0 (ALL jobs)
   * - partialFilter func to create SQL query string
   * - get results
  */

    static async filterBy(jsoncriteria) {
        const turnParams = queryFilterConvert(jsoncriteria)
        console.log(jsoncriteria)
        const { sqlString, values } = sqlForJobFilter(turnParams);
        console.log(sqlString)
        console.log(values);
    
        const results = await db.query(
          `SELECT j.title,
                    j.salary,
                    j.equity,
                    c.name as company
            FROM jobs as j
            LEFT JOIN companies as c
            ON j.company_handle = c.handle
            WHERE ${sqlString}`,
            [...values]
        );
    
        const jobs = results.rows;
    
        if (jobs.length == 0) throw new NotFoundError(`No job was found matching this filter`);
    
        return results.rows;
    }
}

module.exports = Jobs;