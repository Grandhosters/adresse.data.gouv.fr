import {useMemo} from 'react'

import {addressToGeoJson} from '../../../lib/geojson'

function useSources(contour, voies, numeros, numero) {
  return useMemo(() => {
    const sources = []

    if (contour && contour.features.length > 0) {
      sources.push({
        name: 'contour',
        type: 'geojson',
        data: contour
      })
    }

    if (voies && voies.features.length > 0) {
      sources.push({
        name: 'voies',
        type: 'geojson',
        data: voies
      })
    }

    if (numeros && numeros.features.length > 0) {
      const features = numero ?
        numeros.features.filter(feature => feature.properties.id !== numero.id) :
        numeros.features

      sources.push({
        name: 'numeros',
        type: 'geojson',
        data: {type: 'FeatureCollection', features}
      })
    }

    if (numero) {
      sources.push({
        name: 'positions',
        type: 'geojson',
        data: addressToGeoJson(numero)
      })
    }

    return sources
  }, [contour, voies, numeros, numero])
}

export default useSources