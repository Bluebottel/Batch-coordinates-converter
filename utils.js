
function parseFile(file) {
  console.log('parsing file ', file)
  
}

function showError(reference, message) {
  reference.textContent = message
  reference.classList.remove('invisible')
}

function hideError(reference) {
  reference.classList.add('invisible')
  reference.textContent = ''
}

function createBlobUrl(data) {
  const blob = new Blob([ data ], { type: 'application/json' })
  const blobUrl = URL.createObjectURL(blob)

  return blobUrl
}
