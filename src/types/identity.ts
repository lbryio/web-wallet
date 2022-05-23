// TODO: Use our wallet json-schema. Otherwise, bitcoinjs-lib probably already has a networks enum.
// TODO: what about encrypted wallets?

export enum AddressType {
  DeterministicChain =  "deterministic-chain",
  SingleAddress = "single-address",
}

// The `ledger` field of accounts in a wallet (or PrivateAccountInfo).
// TODO - Rename this to "Ledger" to distinguish from `lbry.networks`,
//   particularly since the ledger values are different from the
//   `lbry.networks` field names.
export enum Network {
  MainNet = "lbc_mainnet",
  TestNet = "lbc_testnet",
  RegTest = "lbc_regtest",
}

// Only safe for web wallet, not sent to the app
export interface PrivateAccountInfo {
    address_generator: {
        change?: {
            gap: number,
            maximum_uses_per_address: number,
        },
        name: AddressType,
        receiving?: {
            gap: number,
            maximum_uses_per_address: number,
        }
    },
    certificates: {[key: string]: string},
    encrypted: boolean,
    ledger: Network,
    modified_on: number,
    name: string,
    private_key: string,
    public_key: string,
    seed: string,
}

// can be sent to the app
export interface PublicChannelInfo {
  // TODO - add more useful stuff
  claimId: string;
  handle: string;
  pubKeyAddress: string;

  // Don't care about sending the hmac-verifiable accessLevel to the app for it
  // to send back, as DeSo did. I don't get it, it's overly complicated. We can
  // just check the permissions based on what's in localStorage.
  //
  // Though, maybe this was for the sake of Safari where localStorage doesn't
  // work? We'll see I guess.
  //
  // accessLevel: AccessLevel;
  // accessLevelHmac: string;
}

export enum AccessLevel {
  // User revoked permissions
  None = 0,

  // Unused
  Unused = 1,

  // Approval required for all transactions
  ApproveAll = 2,

  // Approval required for buys, sends, and sells
  ApproveLarge = 3,

  // Node can sign all transactions without approval
  Full = 4,
}

export enum ActionType {
  Action = 0,
  Transaction = 1,
  // TODO - probably gets a lot more detailed than this
}
