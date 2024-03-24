"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Jobs = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
      title: "new",
      salary: 80000,
      equity: "0",
      company_handle: "c1",
    };
  
    test("works", async function () {
      let job = await Jobs.create(newJob);
      expect(job).toEqual(newJob);
  
      const result = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE title = 'new'`);
      expect(result.rows).toEqual([
        {
            title: "new",
            salary: 80000,
            equity: "0",
            company_handle: "c1",
        },
      ]);
    });
  });

/************************************** findAll */

describe("findAll", function () {
    test("works", async function () {
        let jobs = await Jobs.findAll();
        expect(jobs).toEqual([
            {
                title: "j1",
                salary: 100000,
                equity: "0",
                company: "C1",
            },
            {
                title: "j2",
                salary: 100000,
                equity: "0",
                company: "C2",
            },
        ]);
    })
})

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);

        let job = await Jobs.get(job1.rows[0].id);
        expect(job).toEqual({
            title: "j1",
            salary: 100000,
            equity: "0",
            company: "C1",
        })
    });

    test("not found error", async function () {
        try {
            await Jobs.get(1000);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "New",
        salary: 80000,
    };

    test("works", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);

        let job = await Jobs.update(job1.rows[0].id, updateData);
        expect(job).toEqual({
            title: "New",
            salary: 80000,
            equity: "0",
            company_handle: "c1"
        });
    })

    test("not found if no such id", async function () {
        try {
          await Jobs.update(1000, updateData);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
    
    test("bad request with no data", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);

        try {
            await Jobs.update(job1.rows[0].id, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);

      await Jobs.remove(job1.rows[0].id);
      const res = await db.query(
          `SELECT * FROM jobs WHERE id=${job1.rows[0].id}`);
      expect(res.rows.length).toEqual(0);
    });
  
    test("not found if no such id", async function () {
      try {
        await Jobs.remove(1000);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
  });
});
