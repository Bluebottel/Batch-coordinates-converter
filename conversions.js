"use strict"

const DEGREE_SYMBOL = '°'

// 59.420894, 18.374119 => 59°25'15.2"N 18°22'26.8"E
function wgs84decToWgs84(wgs84decCoord) {

  // also remove the space after the comma
  const [ wgs84decCoordLat, wgs84decCoordLon ] = wgs84decCoord.split(',')
	.map(ele => parseFloat(ele.trim()))

  const convertedCoords = [ wgs84decCoordLat, wgs84decCoordLon ]
    .map(partialCoord => {
      const wgs84degrees = partialCoord.toFixed()
      let remainder = partialCoord - wgs84degrees
      const wgs84minutes = (remainder * 60).toFixed()

      // everything after the decimal place
      remainder = (remainder * 60) % 1

      const wgs84seconds = remainder * 60

      return wgs84degrees + DEGREE_SYMBOL + wgs84minutes
	   + "'" + wgs84seconds + '\"'
    })

  return convertedCoords[0] + 'N ' + convertedCoords[1] + 'E'  
}

// 59.420894, 18.374119 => 59°25.254'N 18°22.447'E
function wgs84decToWgs84ddm(wgs84decCoord) {

  // also remove the space after the comma
  const [ wgs84decCoordLat, wgs84decCoordLon ] = wgs84decCoord.split(',')
	.map(ele => parseFloat(ele.trim()))

  const convertedCoords = [ wgs84decCoordLat, wgs84decCoordLon ]
	.map(partialCoord => {
	  const wgs84degrees = partialCoord.toFixed()
	  const wgs84minutes = (partialCoord - wgs84degrees) * 60

	  return wgs84degrees + DEGREE_SYMBOL + wgs84minutes
	    + "'"
	})

  return convertedCoords[0] + 'N ' + convertedCoords[1] + 'E'  
}

// 59°25.254'N 18°22.447'E => 59.420894, 18.374119
function wgs84ddmToWgs84dec(wgs84ddmCoord) {

  const [ wgs84ddmLat, wgs84ddmLon ] = wgs84ddmCoord.split(' ')

  let cleanWgs84ddmLat = wgs84ddmLat.replaceAll(/['NE]/g, '')
  cleanWgs84ddmLat = cleanWgs84ddmLat.replaceAll('°', ' ')

  let cleanWgs84ddmLon = wgs84ddmLon.replaceAll(/['NE]/g, '')
  cleanWgs84ddmLon = cleanWgs84ddmLon.replaceAll('°', ' ')


  // separate degrees and minutes
  cleanWgs84ddmLon = cleanWgs84ddmLon.split(' ')
  cleanWgs84ddmLat = cleanWgs84ddmLat.split(' ')

  
  const lat = parseFloat(cleanWgs84ddmLat[0])
	    + parseFloat(cleanWgs84ddmLat[1]) / 60

  const lon = parseFloat(cleanWgs84ddmLon[0])
	    + cleanWgs84ddmLon[1] / 60

  return `${lat}, ${lon}`
}

// 59°25'15.2"N 18°22'26.8"E => 59.420894, 18.374119
function wgs84toWgs84dec(wgs84coord) {
  const [ wgs84lat, wgs84lon ] = wgs84coord.split(' ')
  const [ cleanWgs84lat, cleanWgs84lon ] =
	[ wgs84lat, wgs84lon ].map(dirtyCoord => {
	  dirtyCoord = dirtyCoord.replaceAll(/['°]/g, ' ')
	  dirtyCoord = dirtyCoord.replaceAll(/["NE]/g, '')
	  return dirtyCoord
	})

  const finishedWgs84lat = cleanWgs84lat.split(' ')
	.reduce((accumulator, ele, i) =>
		parseFloat(accumulator) + ele / 60**i)

   const finishedWgs84lon = cleanWgs84lon.split(' ')
	.reduce((accumulator, ele, i) =>
		parseFloat(accumulator) + ele / 60**i)
  
  return `${finishedWgs84lat}, ${finishedWgs84lon}`
}

function wgs84toWgs84ddm(wgs84coord) {
  const wgs84dec = wgs84toWgs84dec(wgs84coord)
  const wgs84ddm = wgs84decToWgs84ddm(wgs84dec)

  return wgs84ddm
}

function wgs84ddmToWgs84(wgs84ddmCoord) {
  const wgs84dec = wgs84ddmToWgs84dec(wgs84ddmCoord)
  const wgs84ddm = wgs84decToWgs84(wgs84dec)

  return wgs84ddm
}


function getConversionFunction({ sourceFormat, targetFormat }) {
  let func = false;

  // a monstrosity
  switch(sourceFormat) {
    case 'wgs84':
      if (targetFormat === 'wgs84') func = false
      if (targetFormat === 'wgs84ddm') func = wgs84toWgs84ddm
      if (targetFormat === 'wgs84dec') func = wgs84toWgs84dec
      break

    case 'wgs84ddm':
      if (targetFormat === 'wgs84') func = wgs84ddmToWgs84
      if (targetFormat === 'wgs84ddm') func = false
      if (targetFormat === 'wgs84dec') func = wgs84ddmToWgs84dec
      break;

    case 'wgs84dec':
      if (targetFormat === 'wgs84') func = wgs84decToWgs84dec
      if (targetFormat === 'wgs84ddm') func = wgs84decToWgs84ddm
      if (targetFormat === 'wgs84dec') func = false
      break;
  }

  // attempting to "convert" from and to the same format
  if (func === false)  func = arg => arg

  return func
}

function joinLatLon({ format, lat, lon }) {

  let result = false

  switch(format) {
    case 'wgs84':
      result = `${lat} ${lon}`
      break;

    case 'wgs84ddm':
      result = `${lat} ${lon}`
      break;

    case 'wgs84dec':
      result = `${lat}, ${lon}`
      break;
  }

  return result
}

function hasHeaders(data) {
  // if the topmost row contains letters not used in
  // coordinates then it's reasonable to assume that
  // they are actual headers instead of coordinates
  if (data[0][0].match(/[abcdfghijklmopqrstuvwxyzåäö]/i))
    return true
  else return false
}

function massConvert({ sourceFormat, targetFormat, rows}) {
  const conversionFunction = getConversionFunction({
    sourceFormat, targetFormat
  })

  let results = [], headers = false

  // if there are headers then remove them so
  // they don't cause errors in the conversion
  if (hasHeaders(rows)) headers = rows.shift()

  let convertedRows = rows.map(row => {

    // double columns means split latitude and longitude
    if (row.length === 2) {

      const joinedLatLon = joinLatLon({
	format: sourceFormat,
	lat: row[0],
	lon: row[1],
      })
      
      return [ ...row, conversionFunction(joinedLatLon) ]
    }

    else return [ row[0], conversionFunction(row[0]) ]
    
  })

  // put the headers back on top if there are any
  if (headers !== false) {
    headers.push('Converted')
    convertedRows.unshift(headers)
  }

  return convertedRows
}
