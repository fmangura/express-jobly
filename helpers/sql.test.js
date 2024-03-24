const { sqlForPartialUpdate } = require('./sql');

describe('test sqlForPartialUpdate function', function(){
    const testData = {
        name: "TESTING UPDATE func",
        numEmployees: 2,
        description: "This should only change name + desc",
    }

    test('function properly updates', () => {
        const resp = sqlForPartialUpdate(testData, {
            numEmployees: "num_employees"
        })
        expect(resp).toEqual({
            setCols: '"name"=$1, "num_employees"=$2, "description"=$3',
            values: [testData.name, testData.numEmployees, testData.description],
          })
    });
})