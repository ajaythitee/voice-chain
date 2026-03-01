import { http, createConfig } from 'wagmi'
import { polygonAmoy } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = 'e51345186e30467e1a8774ac90ecbcd0'

export const config = createConfig({
    chains: [polygonAmoy],
    connectors: [
        injected(),
        walletConnect({ projectId }),
    ],
    transports: {
        [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology/'),
    },
})
