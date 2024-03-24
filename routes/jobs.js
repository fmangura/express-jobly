"use strict";

/** Routes for Jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, NotFoundError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Jobs = require("../models/jobs");
const Company = require("../models/company");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / 
 * 
 * Checks valid schema else BadRequestError
 * 
 * { title: "string", 
 * salary: integer, 
 * equity: "number as string",  
 * company_handle: 'string' } => { job: { title, salary, equity, company } }
 * 
 * 
*/

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Jobs.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET / 
 * IF no query parameters, just findsAll() no filter: 
 * GET => {jobs: [{ title, salary, equity, company }] }
 * 
 * 
 * ELSE pass in query.params:
 * { title: "string", minSalary: integer, hasEquity: boolean } 
 *      => { jobs: [{ title, salary, equity, company }] }
 * 
 */

router.get("/", async function (req, res, next) {
    try {
        if (Object.keys(req.query).length == 0) {
            const jobs = await Jobs.findAll();
            return res.json({ jobs });
        } else {
            let params = req.query;
            const jobs = await Jobs.filterBy(params)
            return res.json({ jobs });
        }
    } catch (err) {
        return next(err);
    }
});

/** GET /:id  Takes an id returns => { job: { title, salary, equity, company } }*/

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Jobs.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /:id 
 * Admin authorization required. Validates schema.
 * 
 * Patches job data.
 * 
 * Takes json object { title: "string", salary: integer, equity: "number as string" } and 
 * updates job with matching id
 * 
 * returns { job: { title, salary, equity, } }
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.strack);
            throw new BadRequestError(errs);
        }
        const job = await Jobs.update(req.params.id, req.body);
        return res.json( { job });

    } catch(err) {
        return next(err);
    }
});

/** DELETE /[id] => { deleted: id }
 * 
 * Authorization: login or Admin.
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
      await Jobs.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
});



module.exports = router;