import { JBChainId } from "juice-sdk-react";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
} from "viem/chains";

export const MAX_RULESET_COUNT = 3;
export const RESERVED_TOKEN_SPLIT_GROUP_ID = 1n;

export const chainSortOrder = new Map<JBChainId, number>([
  [sepolia.id, 0],
  [optimismSepolia.id, 1],
  [baseSepolia.id, 2],
  [arbitrumSepolia.id, 3],
]);

export const chainIdToLogo = {
  [sepolia.id]: "/assets/img/logo/mainnet.svg",
  [optimismSepolia.id]: "/assets/img/logo/optimism.svg",
  [baseSepolia.id]: "/assets/img/logo/base.svg",
  [arbitrumSepolia.id]: "/assets/img/logo/arbitrum.svg",
  [mainnet.id]: "/assets/img/logo/mainnet.svg",
  [optimism.id]: "/assets/img/logo/optimism.svg",
  [base.id]: "/assets/img/logo/base.svg",
  [arbitrum.id]: "/assets/img/logo/arbitrum.svg",
};

export const BACKED_BY_TOKENS = ["ETH", "USDC"] as const;

export const JB_CURRENCY_ETH = 1;
export const JB_CURRENCY_USD = 3;

export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
  10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Optimism
  421614: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum sepolia
  84532: "0x036cbd53842c5426634e7929541ec2318f3dcf7e", // Base Sepolia
  11155111: "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238", // Ethereum sepolia
  11155420: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // Optimism sepolia
};

export const USDC_DECIMALS = 6;

export const isProduction = process.env.NODE_ENV === "production";
export const externalBaseUrl = isProduction
  ? "https://app.revnet.eth.sucks"
  : "https://147585e1f72a.ngrok.app";

// Swap Terminal addresses per chain (from jbpay-sdk)
export const JBSWAPTERMINAL_ADDRESS: Record<number, `0x${string}`> = {
  [mainnet.id]: "0xdd98b25631aa9372a8cf09912b803d2ad80db161",
  [optimism.id]: "0xf7002a2df9bebf629b6093c8a60e28beed4f7b48",
  [arbitrum.id]: "0xcf50c6f3f366817815fe7ba69b4518356ba6033b",
  [base.id]: "0x9b82f7f43a956f5e83faaf1d46382cba19ce71ab",
  [sepolia.id]: "0x94c5431808ab538d398c6354d1972a0cb8c0b18b",
  [optimismSepolia.id]: "0xb940f0bb31376cad3a0fae7c78995ae899160a52",
  [arbitrumSepolia.id]: "0xcf5f58ebb455678005b7dc6e506a7ec9a3438d0e",
  [baseSepolia.id]: "0xb940f0bb31376cad3a0fae7c78995ae899160a52",
} as const;

// JBPrices contract (price oracle)
export const JBPRICES_ADDRESS = "0xe712d14b04f1a1fe464be930e3ea72b9b0a141d7" as const;

// Common WETH addresses per chain
export const WETH_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  [optimism.id]: "0x4200000000000000000000000000000000000006",
  [arbitrum.id]: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  [base.id]: "0x4200000000000000000000000000000000000006",
  [sepolia.id]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // placeholder
  [optimismSepolia.id]: "0x4200000000000000000000000000000000000006",
  [arbitrumSepolia.id]: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  [baseSepolia.id]: "0x4200000000000000000000000000000000000006",
} as const;

// Supported tokens for swap terminal per chain: symbol -> [address, decimals]
export const SUPPORTED_TOKENS: Record<number, Record<string, [`0x${string}`, number]>> = {
  [mainnet.id]: {
    DAI: ["0x6b175474e89094c44da98b954eedeac495271d0f", 18],
    USDC: ["0xa0b86991c6218b36c1d19D4a2e9eb0ce3606eb48", 6],
    USDT: ["0xdac17f958d2ee523a2206206994597c13d831ec7", 6],
  },
  [arbitrum.id]: {
    DAI: ["0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", 18],
    USDC: ["0xaf88d065e77c8cc2239327c5edb3a432268e5831", 6],
    USDT: ["0xfd086bc7cdc5c481dcc9c85ebe478a1c0b69fcbb9", 6],
  },
  [optimism.id]: {
    DAI: ["0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", 18],
    USDC: ["0x0b2c639c533813f4aa9d7837caf62653d097ff85", 6],
    USDT: ["0x94b008aa00579c1307b0ef2c499ad98a8ce58e58", 6],
  },
  [base.id]: {
    USDC: ["0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", 6],
  },
  [sepolia.id]: {
    USDC: ["0x1c7d4b196cb0c7b01d743fbc6116a902379c7238", 6],
  },
  [baseSepolia.id]: {
    USDC: ["0x036cbd53842c5426634e7929541ec2318f3dcf7e", 6],
  },
  [optimismSepolia.id]: {
    USDC: ["0x5fd84259d66cd46123540766be93dfe6d43130d7", 6],
  },
  [arbitrumSepolia.id]: {
    USDC: ["0x75faf114eafb1bdbe2f0316df893fd58ce46aa4d", 6],
  },
} as const;
