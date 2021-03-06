import React from 'react'
import PropTypes from 'prop-types'
import {Database} from 'react-feather'
import Page from '../layouts/main'

import {getDatasets, getStats} from '../lib/bal/api'
import withErrors from '../components/hoc/with-errors'

import Head from '../components/head'
import BasesLocales from '../components/bases-locales'

const title = 'Bases locales'
const description = 'Bases de données Adresse de périmètre local, éditées sous la responsabilité des collectivités locales.'

class BasesLocalesPage extends React.Component {
  static propTypes = {
    datasets: PropTypes.array.isRequired,
    stats: PropTypes.object.isRequired
  }

  render() {
    const {datasets, stats} = this.props

    return (
      <Page title={title} description={description}>
        <Head title={title} icon={<Database size={56} />} />
        <BasesLocales datasets={datasets} stats={stats} />
      </Page>
    )
  }
}

BasesLocalesPage.getInitialProps = async () => {
  return {
    datasets: await getDatasets(),
    stats: await getStats()
  }
}

export default withErrors(BasesLocalesPage)
