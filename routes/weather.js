var express = require('express')
var router = express.Router()

const fetch = require('node-fetch')
const geoip = require('geoip-lite')
const City = require('../models/cities')

const OWN_API_KEY = process.env.OWN_API_KEY

router.post('/', (req, res) => {
  // Check if the city has not already been added
  City.findOne({
    cityName: { $regex: new RegExp(req.body.cityName, 'i') },
  }).then((dbData) => {
    if (dbData === null) {
      // Request OpenWeatherMap API for weather data
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${req.body.cityName}&appid=${OWN_API_KEY}&units=metric`
      )
        .then((response) => response.json())
        .then((apiData) => {
          // Creates new document with weather data
          const newCity = new City({
            cityName: req.body.cityName,
            main: apiData.weather[0].main,
            description: apiData.weather[0].description,
            tempMin: apiData.main.temp_min,
            tempMax: apiData.main.temp_max,
          })

          // Finally save in database
          newCity.save().then((newDoc) => {
            res.json({ result: true, weather: newDoc })
          })
        })
    } else {
      // City already exists in database
      res.json({ result: false, error: 'City already saved' })
    }
  })
})

// router.get('/', (req, res) => {
//   let ip = '185.146.221.142' // La Capsule Paris
//   if (req.headers['x-real-ip']) {
//     ip = req.headers['x-real-ip'] // Real client IP
//   }

//   const geo = geoip.lookup(ip)
//   const lat = geo.ll[0]
//   const lon = geo.ll[1]

//   City.find().then((dbData) => {
//     fetch(
//       `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWN_API_KEY}&units=metric`
//     )
//       .then((response) => response.json())
//       .then((apiData) => {
//         const currentPosWeather = {
//           cityName: apiData.name,
//           main: apiData.weather[0].main,
//           description: apiData.weather[0].description,
//           tempMin: apiData.main.temp_min,
//           tempMax: apiData.main.temp_max,
//         }

//         res.json({ weather: dbData, currentPosWeather })
//       })
//   })
// })

// router.get('/:cityName', (req, res) => {
//   City.findOne({ cityName: req.params.cityName }).then((data) => {
//     if (data) {
//       res.json({ result: true, weather: data })
//     } else {
//       res.json({ result: false, error: 'City not found' })
//     }
//   })
// })

router.delete('/:cityName', (req, res) => {
  City.deleteOne({ cityName: req.params.cityName }).then((deletedDoc) => {
    if (deletedDoc.deletedCount > 0) {
      City.find().then((data) => {
        res.json({ result: true, weather: data })
      })
    } else {
      res.json({ result: false, error: 'City not found' })
    }
  })
})

router.get('/', (req, res) => {
  console.log('route ')
  let ip = '185.146.221.142' // La Capsule Paris
  if (req.headers['x-real-ip']) {
    ip = req.headers['x-real-ip'] // Real client IP
  }
  const geo = geoip.lookup(ip)
  console.log('geo', geo)
  const lat = geo.ll[0]
  const lon = geo.ll[1]
  //   res.json({ ip: geo })
  City.find().then((dbData) => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWN_API_KEY}&units=metric`
    )
      .then((response) => response.json())
      .then((apiData) => {
        const currentPosWeather = {
          cityName: apiData.name,
          main: apiData.weather[0].main,
          description: apiData.weather[0].description,
          tempMin: apiData.main.temp_min,
          tempMax: apiData.main.temp_max,
        }

        res.json({ weather: dbData, currentPosWeather })
      })
  })
})

module.exports = router
