"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function() {
    const newJob = {
        title: "New",
        salary: 100000,
        equity: "0",
        company_handle: 'c1',
    }

    test("works admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: newJob 
        })
    })

    test("return err if company doesnt exist", async function() {
        const resp = await request(app)
                        .post("/jobs")
                        .send({...newJob, company_handle: 'NONE'})
                        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    })

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title:"New"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    })

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
              ...newJob,
              salary: "wrong",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
      });
})

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("works", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:[
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
                    company: "C1",
                },
                {
                    title: "j3",
                    salary: 100000,
                    equity: "0.001",
                    company: 'C3',
                }
            ]
        })
    })
})

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for all", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);
        let id = job1.rows[0].id

        const resp = await request(app).get(`/jobs/${id}`);
        expect(resp.body).toEqual({
            job: {
                title: "j1",
                salary: 100000,
                equity: "0",
                company: "C1",
            },
        });
    });

    test("no job found for id", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    })
});

/************************************** PATCH /companies/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);
        let id = job1.rows[0].id

        const resp = await request(app)
                        .patch(`/jobs/${id}`)
                        .send({
                            salary: 100,
                        })
                        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                title: "j1",
                salary: 100,
                equity: "0",
                company_handle: "c1",
            },
        });
    });

    test("unauth for anon", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);
        let id = job1.rows[0].id

        const resp = await request(app)
                        .patch(`/jobs/${id}`)
                        .send({
                            salary: 100,
                        })
                expect(resp.statusCode).toEqual(401);
    });

    test("job with id not found", async function () {
        const resp = await request(app)
                        .patch(`/jobs/0`)
                        .send({
                            salary: 100,
                        })
                        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on invalid data", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);
        let id = job1.rows[0].id

        const resp = await request(app)
                        .patch(`/jobs/${id}`)
                        .send({
                            salary: "WRONG",
                        })
                        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);
        let id = job1.rows[0].id

        const resp = await request(app)
                        .delete(`/jobs/${id}`)
                        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: `${id}` });
        });

    test("unauth for anon", async function () {
        let job1 = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`);
        let id = job1.rows[0].id

        const resp = await request(app)
                        .delete(`/jobs/${id}`);
        expect(resp.statusCode).toEqual(401);
    })

    test("job with id not found", async function () {
        const resp = await request(app)
                        .delete(`/jobs/0`)
                        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    })
});

/*********************************GET /companies/?params */

describe("GET /jobs/?title=&minSalary=&hasEquity=&", function () 
{
    test("for all filters, finds 1", async function () {
        const resp = await request(app)
                        .get('/jobs/?title=j&minSalary=1000&hasEquity=true')
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            jobs: [{
                title: "j3",
                salary: 100000,
                equity: "0.001",
                company: 'C3',
            }]
        });
    })

    test("for partial filters, finds >1", async function () {
        const resp = await request(app)
                        .get('/jobs/?title=j&minSalary=1000&hasEquity=false')
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            jobs: [{
                title: "j1",
                salary: 100000,
                equity: "0",
                company: "C1",
            },
            {
                title: "j2",
                salary: 100000,
                equity: "0",
                company: "C1",
            },
            {
                title: "j3",
                salary: 100000,
                equity: "0.001",
                company: 'C3',
            }]
        })
    })

});