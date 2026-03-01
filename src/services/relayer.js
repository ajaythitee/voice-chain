import { createWalletClient, createPublicClient, http, encodePacked, keccak256 } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { polygonAmoy } from 'viem/chains'
import contractConfig from '../contractConfig.json'
import TenderVotingABI from '../TenderVotingABI.json'

const PRIVATE_KEY = import.meta.env.VITE_RELAYER_PRIVATE_KEY

const account = PRIVATE_KEY ? privateKeyToAccount(`0x${PRIVATE_KEY.replace('0x', '')}`) : null

const publicClient = createPublicClient({
    chain: polygonAmoy,
    transport: http('https://rpc-amoy.polygon.technology/')
})

const walletClient = account ? createWalletClient({
    account,
    chain: polygonAmoy,
    transport: http('https://rpc-amoy.polygon.technology/')
}) : null

/**
 * Create tender - gasless
 * @param startTime Unix timestamp when voting starts (0 = start immediately)
 * @param deadline Unix timestamp when voting ends
 */
export async function createTenderGasless(title, description, category, options, startTime, deadline, isRestricted, hideResults, whitelist) {
    if (!walletClient) throw new Error('Relayer not configured')

    const hash = await walletClient.writeContract({
        address: contractConfig.address,
        abi: TenderVotingABI,
        functionName: 'createTender',
        args: [title, description, category, options, BigInt(startTime), BigInt(deadline), isRestricted, hideResults, whitelist]
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return { hash, receipt }
}

/**
 * Get nonce for meta-transaction
 */
export async function getNonce(voterAddress) {
    const nonce = await publicClient.readContract({
        address: contractConfig.address,
        abi: TenderVotingABI,
        functionName: 'getNonce',
        args: [voterAddress]
    })
    return nonce
}

/**
 * Vote with signature (meta-transaction)
 * 1. User signs the vote message
 * 2. Relayer submits with signature
 * @param signMessageAsync - wagmi's signMessageAsync function
 */
export async function voteWithSignature(tenderId, optionIndex, comment, voterAddress, signMessageAsync) {
    if (!walletClient) throw new Error('Relayer not configured')

    // Get current nonce
    const nonce = await getNonce(voterAddress)

    // Create message hash (same as contract)
    const messageHash = keccak256(
        encodePacked(
            ['uint256', 'uint256', 'string', 'address', 'uint256', 'address'],
            [BigInt(tenderId), BigInt(optionIndex), comment, voterAddress, nonce, contractConfig.address]
        )
    )

    // User signs the message using wagmi's signMessageAsync
    const signature = await signMessageAsync({
        message: { raw: messageHash }
    })

    // Relayer submits the transaction
    const hash = await walletClient.writeContract({
        address: contractConfig.address,
        abi: TenderVotingABI,
        functionName: 'voteWithSignature',
        args: [BigInt(tenderId), BigInt(optionIndex), comment, voterAddress, nonce, signature]
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return { hash, receipt }
}

/**
 * Direct vote (user pays gas)
 */
export async function voteDirect(tenderId, optionIndex, comment, walletClientSigner) {
    const hash = await walletClientSigner.writeContract({
        address: contractConfig.address,
        abi: TenderVotingABI,
        functionName: 'vote',
        args: [BigInt(tenderId), BigInt(optionIndex), comment]
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    return { hash, receipt }
}

export const isRelayerConfigured = () => !!walletClient
export const getPublicClient = () => publicClient
