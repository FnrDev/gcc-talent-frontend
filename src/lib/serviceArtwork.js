const ARTWORK_COUNT = 6

function artworkNumber(id) {
  const value = String(id || '')
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % ARTWORK_COUNT
  }

  return hash + 1
}

function serviceArtwork(service) {
  return {
    url: `/placeholders/gig-${artworkNumber(service?._id)}.svg`,
    alt: `Abstract preview for ${service?.name || 'service'}`,
  }
}

export { serviceArtwork }
