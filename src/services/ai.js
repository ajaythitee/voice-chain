import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')

/**
 * Improve title using Gemini AI
 */
export async function improveTitle(title, category) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
        const result = await model.generateContent(`
      Improve this public campaign title to be more engaging and clear:
      Title: ${title}
      Category: ${category}
      
      Rules:
      - Return ONLY the improved title, nothing else
      - No markdown, no formatting, no quotes
      - Keep it concise (max 60 characters)
      - Make it engaging and action-oriented for gathering public opinion
    `)
        return result.response.text().trim().replace(/^["']|["']$/g, '')
    } catch (e) {
        throw new Error('Title improvement failed')
    }
}

/**
 * Improve description using Gemini AI
 */
export async function improveDescription(title, category, desc) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
        const result = await model.generateContent(`
      Improve this public opinion campaign description to be more compelling:
      Campaign Title: ${title}
      Category: ${category}
      Description: ${desc}
      
      Rules:
      - Write 2-3 clear paragraphs explaining the issue
      - Include key points (3 bullet points using •)
      - NO markdown symbols like # or * or **
      - Use plain text only
      - Maximum 300 words
      - Focus on gathering community voice and public opinion
    `)
        return result.response.text()
            .replace(/^#+\s*/gm, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '•')
            .replace(/^- /gm, '• ')
            .trim()
    } catch (e) {
        throw new Error('Description improvement failed')
    }
}

/**
 * Suggest voting options based on campaign
 */
export async function suggestOptions(title, description, category) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
        const result = await model.generateContent(`
      Suggest 2-4 voting options for this public opinion campaign:
      Campaign Title: ${title}
      Campaign Description: ${description || 'Not provided'}
      Category: ${category}
      
      Rules:
      - Return ONLY the options, one per line
      - Make them clear and distinct choices people can vote on
      - Keep each option under 25 characters
      - No numbering, no bullets, no extra text
      - Options should represent different positions on the issue
      - Examples: "Yes, proceed", "No, reject", "Need more info", "Partial approval"
    `)

        return result.response.text().trim().split('\n').map(o => o.trim()).filter(Boolean).slice(0, 4)
    } catch (e) {
        return ['Yes', 'No']
    }
}

/**
 * Generate AI analysis of voting results
 */
export async function generateVoteAnalysis(title, options, votes, comments) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

        const total = votes.reduce((a, b) => a + Number(b), 0)
        const optionData = options.map((opt, i) => {
            const pct = total > 0 ? ((votes[i] * 100) / total).toFixed(1) : 0
            return `${opt}: ${votes[i]} votes (${pct}%)`
        }).join(', ')

        const commentText = comments.slice(0, 5).join('; ')

        const result = await model.generateContent(`
      Analyze this public opinion campaign result:
      Campaign: ${title}
      Total Responses: ${total}
      Results: ${optionData}
      Sample public comments: ${commentText || 'None provided'}
      
      Rules:
      - Write exactly 2 sentences
      - State what the public majority chose and the percentage
      - Be concise and objective
      - No markdown
    `)

        return result.response.text().trim()
    } catch (e) {
        return null
    }
}

/**
 * Parse addresses from file content
 */
export async function parseAddressesFromFile(fileContent, fileName) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
        const result = await model.generateContent(`
      Extract all valid Ethereum wallet addresses from this file:
      File: ${fileName}
      Content: ${fileContent}
      
      Rules:
      - Find ALL valid Ethereum addresses (0x followed by 40 hex characters)
      - Return ONLY the addresses, one per line
      - If no valid addresses, return "NO_ADDRESSES"
    `)

        const text = result.response.text().trim()
        if (text === 'NO_ADDRESSES') return []

        return text.split('\n')
            .map(addr => addr.trim())
            .filter(addr => /^0x[a-fA-F0-9]{40}$/.test(addr))
    } catch (e) {
        return []
    }
}

export const isAIConfigured = () => !!import.meta.env.VITE_GEMINI_API_KEY
