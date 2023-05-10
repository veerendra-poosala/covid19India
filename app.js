//importing required modules
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "covid19IndiaPortal.db");

const initializeDbAndConnectToServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDbAndConnectToServer();

//testing server
app.get("/", async (request, response) => {
  response.send("DB Connected successfully and working fine");
});

//api for user login
app.post("/login/", async (request, response) => {
  try {
    const userDetails = request.body;
    const { username, password } = userDetails;
    const searchUserQuery = `
        SELECT 
            *
        FROM
            user
        WHERE
            username = '${username}';
    `;
    const user = await db.get(searchUserQuery);

    if (user === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      if (username === user.username) {
        const hashPassword = await bcrypt.compare(password, user.password);
        //console.log(hashPassword);
        if (hashPassword == true) {
          const payload = {
            username: username,
          };
          const jwtToken = jwt.sign(payload, "secretkey");
          response.send({ jwtToken });
        } else {
          response.status(400);
          response.send("Invalid password");
        }
      } else {
        response.status(400);
        response.send("Invalid user");
      }
    }
  } catch (e) {
    console.log(e.message);
  }
});

const authenticateToken = async (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "secretkey", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};

app.get("/states/", authenticateToken, async (request, response) => {
  try {
    const dbQuery = `
        SELECT 
            state_id as stateId,
            state_name as stateName,
            population as population
        FROM
            state
        ORDER BY
            state_id;
    `;
    const dbObj = await db.all(dbQuery);
    response.send(dbObj);
  } catch (e) {
    console.log(e.message);
  }
});
//updating district details
app.put(
  "/districts/:districtId",
  authenticateToken,
  async (request, response) => {
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
      console.log(e.message);
    }
  }
);

//getting specific state using stateId
app.get("/states/:stateId", authenticateToken, async (request, response) => {
  try {
    const { stateId } = request.params;
    const dbQuery = `
        SELECT 
            state_id as stateId,
            state_name as stateName,
            population as population
        FROM
            state
        WHERE
            state_id  = ${stateId};
    `;
    const dbObj = await db.get(dbQuery);
    response.send(dbObj);
  } catch (e) {
    console.log(e.message);
  }
});

//adding district into the district table
app.post("/districts/", authenticateToken, async (request, response) => {
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
        INSERT INTo
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
        )
    `;
    await db.run(dbQuery);
    response.send("District Successfully Added");
  } catch (e) {
    console.log(e.message);
  }
});

//deleting specific district details using districtId
app.delete(
  "/districts/:districtId",
  authenticateToken,
  async (request, response) => {
    try {
      const { districtId } = request.params;
      const dbQuery = `
        DELETE
        FROM
            district
        WHERE
            district_id = ${districtId};
    `;
      const dbObj = await db.run(dbQuery);
      response.send("District Removed");
    } catch (e) {
      console.log(e.message);
    }
  }
);
//getting specific district details using districtId
app.get(
  "/districts/:districtId",
  authenticateToken,
  async (request, response) => {
    try {
      const { districtId } = request.params;
      const dbQuery = `
        SELECT 
           district_id as districtId,
           district_name as districtName,
           state_id as stateId,
           cases,
           cured,
           active,
           deaths
        FROM
            district
        WHERE
            district_id = ${districtId};
    `;
      const dbObj = await db.get(dbQuery);
      response.send(dbObj);
    } catch (e) {
      console.log(e.message);
    }
  }
);
//
app.get(
  "/states/:stateId/stats/",
  authenticateToken,
  async (request, response) => {
    try {
      const { stateId } = request.params;
      const dbQuery = `
            SELECT 
                SUM(cases) as totalCases,
                SUM(cured) as totalCured,
                SUM(active) as totalActive,
                SUM(deaths) as totalDeaths
            FROM
                district
            WHERE
                state_id = ${stateId};
        `;
      const dbObj = await db.get(dbQuery);
      response.send(dbObj);
    } catch (e) {
      console.log(e.message);
    }
  }
);
//
module.exports = app;
