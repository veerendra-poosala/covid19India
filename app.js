//importing all the required modules like express,sqlite3,sqlite,path
const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

let db = null;
const dbPath = path.join(__dirname, "covid19India.db");

const initializeDbAndConnectToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndConnectToServer();
//creating GET API for state table here
//this API Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  try {
    const dbQuery = `
        SELECT * FROM state ORDER BY state_id;
    
    `;

    const dbArrObj = await db.all(dbQuery);

    const resArrObj = dbArrObj.map((eachItem) => {
      return {
        stateId: eachItem.state_id,
        stateName: eachItem.state_name,
        population: eachItem.population,
      };
    });

    response.send(resArrObj);
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
  }
});

//getting a particular state using state_id
app.get("/states/:stateId", async (request, response) => {
  try {
    const { stateId } = request.params;
    const dbQuery = `
        SELECT * FROM state WHERE state_id = ${stateId};
    
    `;

    const dbObj = await db.get(dbQuery);

    const resObj = (eachItem) => {
      return {
        stateId: eachItem.state_id,
        stateName: eachItem.state_name,
        population: eachItem.population,
      };
    };

    response.send(resObj(dbObj));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});

//creating an api to Create a district in the district table, district_id is auto-incremented
app.post("/districts/", async (request, response) => {
  try {
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const dbQuery = `
        INSERT INTO 
        district(
            district_name,
            state_id,
            cases,
            cured,
            active,
            deaths
            
        )
        VALUES(
            '${districtName}',
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
        );
        
    `;
    const dbObj = await db.run(dbQuery);
    response.send("District Successfully Added");
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});

//getting a particular district using district_id
app.get("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const dbQuery = `
        SELECT * FROM district WHERE district_id = ${districtId};
    
    `;

    const dbObj = await db.get(dbQuery);

    const resObj = (eachItem) => {
      return {
        districtId: eachItem.district_id,
        districtName: eachItem.district_name,
        stateId: eachItem.state_id,
        cases: eachItem.cases,
        cured: eachItem.cured,
        active: eachItem.active,
        deaths: eachItem.deaths,
      };
    };

    response.send(resObj(dbObj));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});
//deleting a particular district using district_id
app.delete("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const dbQuery = `
        DELETE FROM district WHERE district_id = ${districtId};
    
    `;

    const dbObj = await db.run(dbQuery);

    response.send("District Removed");
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});
//updating a district in the district table, district_id is auto-incremented
app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const dbQuery = `
        UPDATE
        district
        SET
        
            district_name = '${districtName}',
            state_id =  ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
            
        ;
        
        
    `;
    const dbObj = await db.run(dbQuery);
    response.send("District Details Updated");
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
  }
});
//Returning the statistics of total cases, cured, active,
//and deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const dbQuery = `
        SELECT
            SUM(cases) as total_cases,
            SUM(cured)  as total_cured,
            SUM(active) as total_active,
            SUM(deaths) as total_deaths
         FROM
             district 
         WHERE 
            state_id = ${stateId};
    
    `;

    const dbObj = await db.get(dbQuery);

    const resObj = (eachItem) => {
      return {
        totalCases: eachItem.total_cases,
        totalCured: eachItem.total_cured,
        totalActive: eachItem.total_active,
        totalDeaths: eachItem.total_deaths,
      };
    };

    response.send(resObj(dbObj));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});

//Returns an object containing the state name of a district
//based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const dbQuery = `
        SELECT
            state.state_name as state_name
         FROM 
            district 
        INNER JOIN
            state
         ON 
            district.state_id = state.state_id
        WHERE
            district.district_id=${districtId};
    
    `;

    const dbObj = await db.get(dbQuery);
    // console.log(dbObj);

    const resObj = (eachItem) => {
      return {
        stateName: eachItem.state_name,
      };
    };

    response.send(resObj(dbObj));
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
});
//exporting app using default syntax
module.exports = app;
