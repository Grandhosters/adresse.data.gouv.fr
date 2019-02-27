import React from 'react'
import {renderToString} from 'react-dom/server'
import PropTypes from 'prop-types'
import {isEqual} from 'lodash'

import {getNumeroPositions, getNumeroPosition} from '../../lib/bal/item'

import {secureAddLayer, secureAddSource, secureUpdateData} from '../mapbox/helpers'
import {NUMEROS_FILTERS, SELECTED_NUMEROS_FILTERS, DELETED_FILTER, VDELETED_FILTER} from '../mapbox/filters'
import {
  numerosLayer,
  positionsSymbolLayer,
  selectedNumerosLayer,
  numerosPointLayer,
  voiesLayer
} from '../mapbox/layers'

import ContextMenu from './context-menu'

const popupAddress = ({properties}) => renderToString(
  <div>
    <h4>{properties.numeroComplet} {properties.nomVoie}</h4>
    <p>
      <div>Type: {properties.type}</div>
      <div>Source: {properties.source}</div>
    </p>
    Mise à jour: {properties.dateMAJ}
  </div>
)

class CommuneMap extends React.Component {
  state = {
    context: null,
    draggedPosition: null
  }

  static propTypes = {
    map: PropTypes.object.isRequired,
    popup: PropTypes.object.isRequired,
    voies: PropTypes.shape({
      features: PropTypes.array.isRequired
    }),
    numeros: PropTypes.shape({
      features: PropTypes.array.isRequired
    }),
    voie: PropTypes.object,
    numero: PropTypes.object,
    positions: PropTypes.object,
    selectVoie: PropTypes.func.isRequired,
    selectNumero: PropTypes.func.isRequired,
    isLoading: PropTypes.func.isRequired,
    actions: PropTypes.object.isRequired
  }

  static defaultProps = {
    voies: null,
    numeros: null,
    voie: null,
    numero: null,
    positions: null
  }

  componentDidMount() {
    const {map} = this.props

    // Map
    map.once('load', this.onLoad)
    map.on('click', this.mapClick)
    map.on('dataloading', this.onLoading)

    // Voies
    map.on('click', voiesLayer.id, this.voieClick)
    map.on('mouseenter', voiesLayer.id, this.mouseEnter)
    map.on('mouseleave', voiesLayer.id, this.mouseLeave)

    // Numéro
    map.on('click', numerosLayer.id, this.numeroClick)
    map.on('click', selectedNumerosLayer.id, this.numeroClick)
    map.on('mouseenter', selectedNumerosLayer.id, this.mouseEnterNumero)
    map.on('mouseenter', numerosLayer.id, this.mouseEnterNumero)
    map.on('mouseleave', selectedNumerosLayer.id, this.mouseLeaveNumero)
    map.on('mouseleave', numerosLayer.id, this.mouseLeaveNumero)
    map.on('mousedown', numerosLayer.id, this.mouseDown)
    map.on('mousedown', selectedNumerosLayer.id, this.mouseDown)

    // Positions
    map.on('click', positionsSymbolLayer.id, this.clickPosition)
    map.on('mouseenter', positionsSymbolLayer.id, this.mouseEnter)
    map.on('mouseleave', positionsSymbolLayer.id, this.mouseLeave)
    map.on('mousedown', positionsSymbolLayer.id, this.mouseDown)
  }

  componentDidUpdate(prevProps) {
    const {map, voies, numeros, voie, numero, positions, isLoading} = this.props
    const sourceToUpdate = []

    const updapteNumPos = () => {
      sourceToUpdate.push({id: 'positions', data: positions})
    }

    if (!isEqual(numero, prevProps.numero)) {
      updapteNumPos()
    }

    if (!isEqual(voies, prevProps.voies) || !isEqual(voie, prevProps.voie)) {
      sourceToUpdate.push({id: 'voies', data: voies})
    }

    if (!isEqual(numeros, prevProps.numeros)) {
      sourceToUpdate.push({id: 'numeros', data: numeros})

      if (numero) {
        updapteNumPos()
      }
    }

    this.setMode()

    const waiting = () => {
      if (map.isStyleLoaded() && map.areTilesLoaded()) {
        isLoading(false)
        if (sourceToUpdate.length > 0) {
          sourceToUpdate.forEach(source => {
            const {id, data} = source
            secureUpdateData(map, id, data)
          })
          this.onLoad()
        }
      } else {
        setTimeout(waiting, 200)
      }
    }

    waiting()
  }

  componentWillUnmount() {
    const {map} = this.props

    // Map
    map.off('load', this.onLoad)
    map.off('click', this.mapClick)
    map.off('dataloading', this.onLoading)

    // Voies
    map.off('click', voiesLayer.id, this.voieClick)
    map.off('mouseenter', voiesLayer.id, this.mouseEnter)
    map.off('mouseleave', voiesLayer.id, this.mouseLeave)

    // Numéro
    map.off('click', numerosLayer.id, this.numeroClick)
    map.off('click', selectedNumerosLayer.id, this.numeroClick)
    map.off('mouseenter', selectedNumerosLayer.id, this.mouseEnterNumero)
    map.off('mouseenter', numerosLayer.id, this.mouseEnterNumero)
    map.off('mouseleave', selectedNumerosLayer.id, this.mouseLeaveNumero)
    map.off('mouseleave', numerosLayer.id, this.mouseLeaveNumero)
    map.off('mousedown', numerosLayer.id, this.mouseDown)
    map.off('mousedown', selectedNumerosLayer.id, this.mouseDown)

    // Position
    map.off('click', positionsSymbolLayer.id, this.clickPosition)
    map.off('mouseenter', positionsSymbolLayer.id, this.mouseEnter)
    map.off('mouseleave', positionsSymbolLayer.id, this.mouseLeave)
    map.off('mousedown', positionsSymbolLayer.id, this.mouseDown)
  }

  setMode() {
    const {voie, numero} = this.props

    if (numero) {
      this.mode = 'numero'
    } else if (voie) {
      this.mode = 'voie'
    } else {
      this.mode = 'commune'
    }
  }

  onLoading = () => {
    const {isLoading} = this.props
    isLoading(true)
  }

  onLoad = () => {
    const {map, voies, numeros, positions} = this.props

    // Sources
    secureAddSource(map, 'voies', voies)
    secureAddSource(map, 'numeros', numeros)
    secureAddSource(map, 'positions', positions)

    // Layers
    secureAddLayer(map, numerosPointLayer)
    secureAddLayer(map, numerosLayer)
    secureAddLayer(map, selectedNumerosLayer)
    secureAddLayer(map, voiesLayer)
    secureAddLayer(map, positionsSymbolLayer)

    this.resetLayers()

    if (this.mode === 'numero') {
      this.numeroMode()
    } else if (this.mode === 'voie') {
      this.voieMode()
    }
  }

  setSelectedFilters = () => {
    const {map, voie} = this.props
    const numerosFilters = [...NUMEROS_FILTERS]
    const selectedFilters = [
      'all',
      DELETED_FILTER,
      VDELETED_FILTER,
      ['==', ['get', 'codeVoie'], voie.codeVoie]
    ]

    numerosFilters.push(['!=', ['get', 'codeVoie'], voie.codeVoie])

    map.setFilter('numeros', numerosFilters)
    map.setFilter('numeros-point', numerosFilters)
    map.setFilter('selected-numeros', selectedFilters)
  }

  resetLayers = () => {
    const {map} = this.props

    map.setFilter('numeros', NUMEROS_FILTERS)
    map.setFilter('selected-numeros', SELECTED_NUMEROS_FILTERS)
    map.setFilter('numeros-point', NUMEROS_FILTERS)

    map.setLayoutProperty(selectedNumerosLayer.id, 'visibility', 'none')
    map.setLayoutProperty(positionsSymbolLayer.id, 'visibility', 'none')
    map.setLayoutProperty(voiesLayer.id, 'visibility', 'visible')
  }

  voieMode = () => {
    const {map, voie} = this.props

    if (voie) {
      this.setSelectedFilters()

      map.setPaintProperty(numerosLayer.id, 'text-opacity', 0.4)
      map.setLayoutProperty(selectedNumerosLayer.id, 'visibility', 'visible')
      map.setLayoutProperty(voiesLayer.id, 'visibility', 'none')
    }
  }

  numeroMode = () => {
    const {map, voie, numero} = this.props

    map.setLayoutProperty(voiesLayer.id, 'visibility', 'none')
    map.setLayoutProperty(positionsSymbolLayer.id, 'visibility', 'visible')

    map.setFilter('numeros', ['!=', ['get', 'id'], numero.id])
    map.setFilter('numeros-point', ['!=', ['get', 'id'], numero.id])
    map.setFilter('selected-numeros', [
      'all',
      ['!=', ['get', 'id'], numero.id],
      ['==', ['get', 'codeVoie'], voie.codeVoie],
      DELETED_FILTER,
      VDELETED_FILTER
    ])
  }

  mouseEnter = () => {
    const {map} = this.props
    map.getCanvas().style.cursor = 'pointer'
  }

  mouseLeave = () => {
    const {map} = this.props
    map.getCanvas().style.cursor = ''
  }

  mouseEnterNumero = e => {
    const {map, popup, numeros} = this.props
    const {id} = e.features[0].properties
    const numero = numeros.features.find(n => n.properties.id === id)
    const coordinates = numero.geometry.coordinates.slice()
    const description = popupAddress(numero)

    map.getCanvas().style.cursor = 'pointer'

    popup.setLngLat(coordinates)
      .setHTML(description)
      .addTo(map)
  }

  mouseLeaveNumero = () => {
    const {map, popup} = this.props

    map.getCanvas().style.cursor = ''
    popup.remove()
  }

  mapClick = event => {
    const {context} = this.state

    if (context) {
      this.closeContextMenu()
    } else {
      const {layerX, layerY} = event.originalEvent
      const {lng, lat} = event.lngLat

      this.setState({
        context: {
          item: null,
          coordinates: [lng, lat],
          layer: {layerX, layerY}
        }
      })
    }
  }

  voieClick = event => {
    const {voies, selectVoie} = this.props
    const {codeVoie} = event.features[0].properties
    const voie = voies.features.find(v => v.properties.codeVoie === codeVoie).properties
    const {layerX, layerY} = event.originalEvent

    this.setState({
      context: {
        item: voie,
        coordinates: null,
        layer: {layerX, layerY},
        selectItem: () => selectVoie(voie)
      }
    })
  }

  numeroClick = event => {
    const {numeros, selectNumero} = this.props
    const {id} = event.features[0].properties
    const numero = numeros.features.find(n => n.properties.id === id).properties
    const {layerX, layerY} = event.originalEvent

    this.setState({
      context: {
        item: numero,
        coordinates: null,
        layer: {layerX, layerY},
        selectItem: () => selectNumero(numero)
      }
    })
  }

  clickPosition = event => {
    const {numero} = this.props
    const {_id} = event.features[0].properties
    const position = getNumeroPositions(numero).find(p => p._id === _id)
    const {layerX, layerY} = event.originalEvent

    this.setState({
      context: {
        item: position,
        coordinates: null,
        layer: {layerX, layerY},
        selectItem: () => null
      }
    })
  }

  closeContextMenu = () => {
    this.setState({context: null})
  }

  onMove = event => {
    const {draggedPosition} = this.state
    const {map, numeros, positions} = this.props
    const {feature} = draggedPosition
    const coords = event.lngLat

    map.getCanvas().style.cursor = 'grabbing'

    feature.geometry.coordinates = [coords.lng, coords.lat]

    if (positions) {
      map.getSource('positions').setData(positions)
    } else {
      map.getSource('numeros').setData(numeros)
    }
  }

  onUp = async () => {
    const {draggedPosition} = this.state
    const {map, actions} = this.props
    const {position, numero, feature} = draggedPosition
    const {coordinates} = feature.geometry

    map.getCanvas().style.cursor = ''

    if (position.coords !== coordinates) {
      position.coords = coordinates
      const positions = getNumeroPositions(numero).filter(p => p._id !== position._id)
      positions.push(position)

      try {
        await actions.updateNumero(numero, {positions})
      } catch (error) {
        // TODO Display error
      }
    }

    this.setState({draggedPosition: null})

    map.off('mousemove', this.onMove)
    map.off('mousemove', selectedNumerosLayer.id, this.onMove)
  }

  mouseDown = event => {
    const {map, numeros, numero, positions, popup} = this.props
    const feature = event.features[0]

    if (numero) {
      const positionFeature = positions.features.find(p => p._id === feature._id)
      this.setState({
        draggedPosition: {
          feature: positionFeature,
          numero: numeros.features.find(f => f.properties.id === numero.id).properties,
          position: positionFeature.properties
        }
      })
    } else {
      const numeroFeature = numeros.features.find(f => f.properties.id === feature.properties.id)
      this.setState({
        draggedPosition: {
          feature: numeroFeature,
          numero: numeroFeature.properties,
          position: getNumeroPosition(numeroFeature.properties)
        }
      })
    }

    event.preventDefault()
    popup.remove()

    map.getCanvas().style.cursor = 'grab'

    map.on('mousemove', this.onMove)
    map.once('mouseup', this.onUp)
  }

  render() {
    const {context} = this.state
    const {voies, voie, numero, actions} = this.props

    return (context && (
      <ContextMenu
        item={context.item}
        voie={voie}
        numero={numero}
        voies={voies.features.map(voie => voie.properties)}
        coordinates={context.coordinates}
        layer={context.layer}
        actions={actions}
        selectItem={context.selectItem}
        close={this.closeContextMenu}
      />
    ))
  }
}

export default CommuneMap
