import dotenv from 'dotenv'

dotenv.config({path: './.env'})

export const COINBASE_KEY = process.env.COINBASE_KEY
export const COINBASE_SECRET = process.env.COINBASE_SECRET
export const COINBASE_PASSPHRASE = process.env.COINBASE_PASSPHRASE

export const ARTIFIX_SECRET = process.env.ARTIFIX_SECRET
export const INFURA_API_URL = process.env.INFURA_API_URL

export const STACKS_API_URL = process.env.STACKS_API_URL
export const MAINNET = process.env.MAINNET