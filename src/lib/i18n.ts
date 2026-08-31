import type { Locale } from "./useLocale";

/**
 * Flat UI string dictionaries. English is the fallback; Indonesian (id) is the
 * differentiator — no other token-creation tool speaks Bahasa Indonesia
 * natively in-app (Smithii does, off-Base). Add a key here, add it to both.
 */
export const STRINGS = {
  en: {
    tagline: "Create tokens, wrap ETH, and send ERC-20 transfers on {chain}.",
    connectWallet: "Connect wallet",
    disconnect: "Disconnect",
    walletOptions: "Wallet options",
    connecting: "Connecting",
    createTitle: "Create a token",
    createDesc:
      "Deploys a fixed-supply ERC-20; the entire supply is minted to you.",
    name: "Name",
    symbol: "Symbol",
    supply: "Total supply (whole tokens)",
    connectToDeploy: "Connect a wallet to deploy",
    deployToken: "Deploy token",
    preflight: "Before you sign — this token, by contract design:",
    preflightFixed: "Supply fixed forever",
    preflightNoMint: "No mint function",
    preflightNoOwner: "No owner, no admin",
    feeHonesty:
      "Platform fee: 0 ETH, always. You only pay the network fee above.",
    networkFee: "ETH network fee",
    balances: "Balances",
    refresh: "Refresh",
    updated: "Updated {age}",
    justNow: "just now",
    secondsAgo: "{n}s ago",
    minutesAgo: "{n}m ago",
    yourTokens: "Your tokens",
    yourTokensDesc: "Tokens you have deployed through this factory.",
    wrapSend: "Wrap and send",
    wrapHint: "Connect a wallet to wrap ETH ↔ WETH and send ERC-20 transfers.",
    balancesHint: "Connect a wallet to read your ETH and WETH balances.",
    learnCta: "New to tokens? Read the 60-second FAQ →",
    footer: "Testnet only. Every transaction is signed in your own wallet; this app never holds keys.",
    staleBanner: "The network connection is failing — figures below may be stale.",
    retryNow: "Retry now",
  },
  id: {
    tagline: "Buat token, tukar ETH, dan kirim ERC-20 di {chain}.",
    connectWallet: "Hubungkan wallet",
    disconnect: "Putuskan",
    walletOptions: "Pilihan wallet",
    connecting: "Menghubungkan",
    createTitle: "Buat token",
    createDesc:
      "Deploy ERC-20 dengan supply tetap; seluruh supply langsung jadi milik Anda.",
    name: "Nama",
    symbol: "Simbol",
    supply: "Total supply (token utuh)",
    connectToDeploy: "Hubungkan wallet untuk deploy",
    deployToken: "Deploy token",
    preflight: "Sebelum tanda tangan — token ini, sesuai desain kontraknya:",
    preflightFixed: "Supply tetap selamanya",
    preflightNoMint: "Tidak bisa dicetak tambahan",
    preflightNoOwner: "Tanpa owner, tanpa admin",
    feeHonesty:
      "Biaya platform: 0 ETH, selamanya. Anda hanya membayar biaya jaringan di atas.",
    networkFee: "ETH biaya jaringan",
    balances: "Saldo",
    refresh: "Segarkan",
    updated: "Diperbarui {age}",
    justNow: "baru saja",
    secondsAgo: "{n} dtk lalu",
    minutesAgo: "{n} mnt lalu",
    yourTokens: "Token Anda",
    yourTokensDesc: "Token yang pernah Anda deploy lewat factory ini.",
    wrapSend: "Wrap & kirim",
    wrapHint: "Hubungkan wallet untuk tukar ETH ↔ WETH dan kirim ERC-20.",
    balancesHint: "Hubungkan wallet untuk melihat saldo ETH dan WETH.",
    learnCta: "Baru kenal token? Baca FAQ 60 detik →",
    footer: "Hanya testnet. Setiap transaksi ditandatangani di wallet Anda sendiri; aplikasi ini tidak pernah menyimpan kunci.",
    staleBanner: "Koneksi jaringan bermasalah — angka di bawah mungkin tidak mutakhir.",
    retryNow: "Coba lagi",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];

export function t(locale: Locale, key: StringKey, vars?: Record<string, string>): string {
  const dict = STRINGS[locale] ?? STRINGS.en;
  let value: string = dict[key];
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, replacement);
    }
  }
  return value;
}

