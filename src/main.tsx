import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import './styles.css'

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
        body: { value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
        mono: { value: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' },
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <App />
      <Analytics />
    </ChakraProvider>
  </StrictMode>,
)
