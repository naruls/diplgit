import express from 'express';
import pg from 'pg';
import fetch from 'node-fetch';
import cors from 'cors';
import _ from 'lodash'; /*необходимая для merge библиотека*/
import fs from 'fs';

var objDataTo = {};
var objEndOp = {};
var objEndData = {};

const app = express();

var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
    methods: "GET",
}

const client = new pg.Client({
    user: 'postgres',
    host: '172.16.117.193',
    database: 'Wether_test',
    password: '1234',
    port: 5432,
});

client.connect();

app.use(cors(corsOptions));

const { PORT = 3002 } = process.env;

const cordHibin = {
  lat: 67.670036,
  lon: 33.687525,
};

const osinovaiRosFirsPointTomorrow = "https://api.tomorrow.io/v4/timelines?location=67.670036,33.687525&fields=temperature,windSpeed,windGust,windDirection,pressureSeaLevel,humidity&timesteps=current&units=metric&timezone=Europe/Moscow&apikey=sCUblc1wePiFH49ZtaUla6zoB0N62pCv";
const osinovaiRosFirsPointOpenweter = "https://api.openweathermap.org/data/2.5/weather?lat=67.670036&lon=33.687525&lang=fr&appid=6264921aac158477ee4f86c2486e4f38";


app.use(express.json());

function fetchDataOpenweathermap(link){
  fetch(link)
    .then(res => res.json())
    .then(json => {

        console.log(json);

        const query = `
          INSERT INTO in_openweather (temperature, windSpeed, windDegree, windGust, pressure, humidity, lon, lat)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *
        `;
        client.query(query, [json.main.temp, json.wind.speed, json.wind.deg, json.wind.gust, json.main.pressure, json.main.humidity, cordHibin.lon, cordHibin.lat], (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log('Data insert successful');
        });
      })
      .catch(err =>{
        console.log(err);
      })

}


function fetchDataTomorroyApi(link) {
  fetch(link)
    .then(res => res.json())
    .then(json => {
    	fs.writeFile('data.txt', JSON.stringify(json), (err) => {
        if(err) throw err;
        console.log('Data has been replaced!');
    });
        console.log(json.data.timelines[0].intervals[0].values);
        const query = `
          INSERT INTO in_tomorrowapi (temperature, humidity, pressure, windSpeed, windDirection, windGust, time)
          VALUES ($1, $2, $3, $4, $5, $6, $7) returning *
        `;
        client.query(query, [json.data.timelines[0].intervals[0].values.temperature, json.data.timelines[0].intervals[0].values.humidity,
        	json.data.timelines[0].intervals[0].values.pressureSeaLevel, json.data.timelines[0].intervals[0].values.windSpeed,
        	json.data.timelines[0].intervals[0].values.windDirection, json.data.timelines[0].intervals[0].values.windGust,
        	json.data.timelines[0].intervals[0].startTime], (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log('Data insert successful');
        });
      })
    .catch(err =>{
      console.log(err);
    })

}
/*
function script(){
  const query = `
  SELECT temp,wind,lon,lat FROM openweather WHERE id=(select max(id) from openweather)
`;
  client.query(query, (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
    objDataTo = { tempEnd: res.rows[0].temp, lonEnd: res.rows[0].lon, latEnd: res.rows[0].lat };
    console.log(res.rows[0].temp);
    fs.writeFile('data.txt', JSON.stringify({tempEnd: res.rows[0].temp, lonEnd: res.rows[0].lon, latEnd: res.rows[0].lat}), (err) => {
        if(err) throw err;
        console.log('Data has been replaced!');
    });
  });
  const query2 = `
  SELECT temp,wind FROM tomorrowapi WHERE id=(select max(id) from tomorrowapi)
`;
  client.query(query2, (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
    objEndOp = { windEnd: res.rows[0].wind};
    console.log(res.rows[0].wind);
    fs.appendFile('data.txt', JSON.stringify({windEnd: res.rows[0].wind}), (err) => {
        if(err) throw err;
        console.log('Data has been replaced!');
    });
  });
  var objResult = _.merge(objEndOp, objDataTo);
  objEndData = objResult;
  console.log(objEndData);
}
*/
/*
function endDataWork() {
  const query3 = `
    INSERT INTO endData (tempend, windend, lonend, latend)
    VALUES ($1, $2, $3, $4) returning *
    `;
  client.query(query3, [objEndData.tempEnd-273, objEndData.windEnd, objEndData.lonEnd, objEndData.latEnd], (err, res) => {
    if (err) {
        console.error(err);
        return;
    }
      console.log('Data insert successful');
  });
}
*/

function endFuction(linkOpen, linkTomorrow) {
  fetchDataOpenweathermap(linkOpen);
  fetchDataTomorroyApi(linkTomorrow);
/*
  let timer1 = setTimeout(() => script(), 2000);
  let timer2 = setTimeout(() => script(), 3000);
  let timer3 = setTimeout(() => endDataWork(), 4000);
*/
}


let timerId = setInterval(() => endFuction(osinovaiRosFirsPointOpenweter, osinovaiRosFirsPointTomorrow), 600000);


/*
app.get('/objEndData', (request, response) => {
    response.send(objEndData);
});
*/

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
