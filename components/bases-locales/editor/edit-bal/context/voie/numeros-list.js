import React from 'react'
import PropTypes from 'prop-types'

import theme from '../../../../../../styles/theme'

import Notification from '../../../../../notification'

import CreateItemWrapper from '../../create-item-wrapper'

import NumeroItem from './numero-item'

class NumerosList extends React.Component {
  state = {
    displayForm: false
  }

  static propTypes = {
    codeCommune: PropTypes.string.isRequired,
    codeVoie: PropTypes.string.isRequired,
    numeros: PropTypes.object.isRequired,
    actions: PropTypes.shape({
      addItem: PropTypes.func.isRequired,
      select: PropTypes.func.isRequired
    }).isRequired
  }

  toggleForm = () => {
    this.setState(state => {
      return {
        displayForm: !state.displayForm
      }
    })
  }

  render() {
    const {displayForm} = this.state
    const {codeCommune, codeVoie, numeros, actions} = this.props

    return (
      <div className='numeros-list'>
        <div className='title'>
          <h3>Liste des numéros</h3>
        </div>

        <div className='divider' />

        <CreateItemWrapper
          title='Création d’un nouveau numéro'
          buttonText='Ajouter un numéro'
          displayForm={displayForm}
          toggleForm={this.toggleForm}
        >
          <Notification type='info'>
            Vous pouvez ajouter un numéro à cette voie directement depuis la carte en effectuant un clique droit.
          </Notification>
        </CreateItemWrapper>

        <div className='list'>
          {Object.keys(numeros).map(n => {
            const numero = numeros[n]
            return (
              <NumeroItem
                key={n}
                codeCommune={codeCommune}
                codeVoie={codeVoie}
                numero={numero}
                actions={actions}
              />
            )
          })}
        </div>

        <style jsx>{`
          .title {
            display: flex;
            align-items: center;
          }

          .divider {
            width: 100%;
            border-bottom: 1px solid ${theme.border};
            padding-bottom: 0.5em;
            margin-bottom: 0.5em;
          }

          .numeros-list {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: content;
          }

          .list {
            margin: 0.5em 0;
          }
        `}</style>
      </div>
    )
  }
}

export default NumerosList
