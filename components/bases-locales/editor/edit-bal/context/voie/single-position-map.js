import React from 'react'
import PropTypes from 'prop-types'
import mapboxgl from 'mapbox-gl'
import mapStyle from 'mapbox-gl/dist/mapbox-gl.css'
import computeBbox from '@turf/bbox'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import mapDrawStyle from '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

import {pointOnCoords, numeroPointStyles} from '../../../../../../lib/mapbox-gl'

import SwitchInput from '../../../../../explorer/table-list/filters/switch-input'

const STYLES = {
  vector: 'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json',
  ortho: {
    version: 8,
    glyphs: 'https://orangemug.github.io/font-glyphs/glyphs/{fontstack}/{range}.pbf',
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: ['https://wxs.ign.fr/eop8s6g4hrpvxnxer1g6qu44/geoportail/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}'],
        tileSize: 256,
        attribution: '© IGN'
      }},
    layers: [{
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles'
    }]
  }
}

const createFeatureCollection = coords => {
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: pointOnCoords(coords)
    }]
  }
}

class PositionMap extends React.Component {
  style = STYLES.vector

  static propTypes = {
    bounds: PropTypes.object,
    coords: PropTypes.array,
    handlePosition: PropTypes.func.isRequired
  }

  static defaultProps = {
    bounds: null,
    coords: null
  }

  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'https://openmaptiles.geo.data.gouv.fr/styles/osm-bright/style.json',
      center: [1.7191, 46.7111],
      zoom: 5
    })

    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        trash: true
      },
      styles: numeroPointStyles
    })

    this.map.on('load', this.onLoad)
    this.map.addControl(this.draw)

    this.map.on('styledata', this.styleData)

    this.map.on('draw.create', this.createPosition)
    this.map.on('draw.update', this.createPosition)
    this.map.on('draw.delete', () => this.props.handlePosition(null))

    this.fitBounds()
  }

  componentDidUpdate(prevProps) {
    const {coords} = this.props
    const {draw} = this

    if (coords && coords !== prevProps.coords) {
      draw.set(createFeatureCollection(coords))
    }
  }

  componentWillUnmount() {
    const {map} = this

    map.off('styledata', this.styleData)

    map.off('draw.create', this.createPosition)
    map.off('draw.delete', () => this.props.handlePosition(null))
  }

  fitBounds = () => {
    const {bounds, coords} = this.props
    const toCompute = bounds || createFeatureCollection(coords)
    const bbox = computeBbox(toCompute)

    this.map.fitBounds(bbox, {
      padding: 30,
      linear: true,
      maxZoom: 16,
      duration: 0
    })
  }

  styleData = () => {
    const {map} = this

    if (map.isStyleLoaded()) {
      if (!map.getSource('data')) {
        this.onLoad()
      }
    } else {
      setTimeout(this.styleData, 1000)
    }
  }

  onLoad = () => {
    const {draw} = this
    const {coords} = this.props

    const feature = {
      type: 'Feature',
      properties: {},
      geometry: pointOnCoords(coords)
    }

    draw.add(feature)
  }

  createPosition = event => {
    const {handlePosition} = this.props
    const currentFeature = event.features[0]

    handlePosition(currentFeature.geometry.coordinates)
  }

  switchLayer = () => {
    const {map, style} = this
    this.style = style === STYLES.vector ? STYLES.ortho : STYLES.vector

    map.setStyle(this.style, {diff: false})
  }

  render() {
    const {style} = this

    return (
      <div className='container'>
        <div ref={el => {
          this.mapContainer = el
        }} className='container' />

        <SwitchInput
          handleChange={this.switchLayer}
          label='Vue aérienne'
          isChecked={style === STYLES.ortho}
        />

        <style
          dangerouslySetInnerHTML={{__html: mapStyle + mapDrawStyle}} // eslint-disable-line react/no-danger
        />
        <style jsx>{`
          .container {
            position: relative;
            height: 400px;
            width: 100%;
          }
        `}</style>
      </div>
    )
  }
}

export default PositionMap