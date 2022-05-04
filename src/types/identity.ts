// TODO: Use our wallet json-schema. Otherwise, bitcoinjs-lib probably already has a networks enum.
// TODO: what about encrypted wallets?

export enum AddressType {
  DeterministicChain =  "deterministic-chain",
  SingleAddress = "single-address",
}

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
export interface PublicAccountInfo {
  // TODO - add more useful stuff
  name: string;
  network: Network;
  accessLevel: AccessLevel;
  accessLevelHmac: string;
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
