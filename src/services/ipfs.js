const JWT = import.meta.env.VITE_PINATA_JWT
const GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

export async function uploadFile(file) {
    if (!JWT) throw new Error('Pinata not configured. Add VITE_PINATA_JWT to .env')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: { Authorization: `Bearer ${JWT}` },
        body: formData
    })

    const data = await res.json()
    if (data.error) throw new Error(data.error || 'IPFS upload failed')
    if (!data.IpfsHash) throw new Error('No hash returned from IPFS')
    return { hash: data.IpfsHash, url: `${GATEWAY}/ipfs/${data.IpfsHash}` }
}

export async function uploadJSON(json) {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${JWT}`
        },
        body: JSON.stringify({ pinataContent: json })
    })

    const data = await res.json()
    return { hash: data.IpfsHash, url: `${GATEWAY}/ipfs/${data.IpfsHash}` }
}

export async function fetchIPFS(hash) {
    const res = await fetch(`${GATEWAY}/ipfs/${hash}`)
    return res.json()
}

export const isPinataConfigured = () => !!JWT
