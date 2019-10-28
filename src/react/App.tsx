import React from 'react'
import { hot } from 'react-hot-loader/root'

const AppContainer = () => <div>Hello World!</div>

export const App = __DEV__ ? hot(AppContainer) : AppContainer
