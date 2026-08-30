const ARTWORK_COUNT = 6

function artworkNumber(id) {
  const value = String(id || '')
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % ARTWORK_COUNT
  }

  return hash + 1
}

function placeholderArtwork(service) {
  return {
    url: `/placeholders/gig-${artworkNumber(service?._id)}.svg`,
    alt: `Abstract preview for ${service?.name || 'service'}`,
  }
}

function serviceGallery(service) {
  const images = Array.isArray(service?.images)
    ? service.images
      .filter((image) => typeof image?.url === 'string' && image.url)
      .map((image, index) => ({
        url: image.url,
        alt: `${service?.name || 'Service'} image ${index + 1}`,
      }))
    : []

  return images.length ? images : [placeholderArtwork(service)]
}

function serviceArtwork(service) {
  return serviceGallery(service)[0]
}

export { serviceArtwork, serviceGallery }
