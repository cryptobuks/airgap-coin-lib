import { ICoinProtocol } from '../protocols/ICoinProtocol'
import BigNumber from 'bignumber.js'
import { IAirGapTransaction } from '../interfaces/IAirGapTransaction'
import { getProtocolByIdentifier } from '..'
import { IAirGapWallet } from '../interfaces/IAirGapWallet'

export class AirGapWallet implements IAirGapWallet {

  public addresses: string[] = [] // used for cache
  public coinProtocol: ICoinProtocol

  constructor(public protocolIdentifier: string, public publicKey: string, public isExtendedPublicKey: boolean, public derivationPath: string) {
    let coinProtocol = getProtocolByIdentifier(this.protocolIdentifier)
    if (coinProtocol) {
      this.coinProtocol = coinProtocol
    } else {
      throw Error('Unknown protocol')
    }
  }

  get receivingPublicAddress(): string {
    return this.addresses[0]
  }

  deriveAddresses(amount: number = 50): string[] {
    if (this.isExtendedPublicKey) {
      const parts = this.derivationPath.split('/')
      let offset = 0

      if (!parts[parts.length - 1].endsWith('\'')) {
        offset = Number.parseInt(parts[parts.length - 1], 10)
      }

      return [...this.coinProtocol.getAddressesFromExtendedPublicKey(this.publicKey, 0, amount, offset), ...this.coinProtocol.getAddressesFromExtendedPublicKey(this.publicKey, 1, amount, offset)]
    } else {
      return [this.coinProtocol.getAddressFromPublicKey(this.publicKey)]
    }
  }

  balanceOf(): Promise<BigNumber> {
    if (this.addresses.length > 0) {
      return this.coinProtocol.getBalanceOfAddresses(this.addresses)
    } else if (this.isExtendedPublicKey) {
      return this.coinProtocol.getBalanceOfExtendedPublicKey(this.publicKey, 0)
    } else {
      return this.coinProtocol.getBalanceOfPublicKey(this.publicKey)
    }
  }

  fetchTransactions(limit: number, offset: number): Promise<IAirGapTransaction[]> {
    if (this.addresses.length > 0) {
      return this.coinProtocol.getTransactionsFromAddresses(this.addresses, limit, offset)
    } else if (this.isExtendedPublicKey) {
      return this.coinProtocol.getTransactionsFromExtendedPublicKey(this.publicKey, limit, offset)
    } else {
      return this.coinProtocol.getTransactionsFromPublicKey(this.publicKey, limit, offset)
    }
  }

  prepareTransaction(recipients: string[], values: BigNumber[], fee: BigNumber): Promise<IAirGapTransaction> {
    if (this.isExtendedPublicKey) {
      return this.coinProtocol.prepareTransactionFromExtendedPublicKey(this.publicKey, 0, recipients, values, fee)
    } else {
      return this.coinProtocol.prepareTransactionFromPublicKey(this.publicKey, recipients, values, fee)
    }
  }

  toJSON(): any {
    let json = Object.assign({}, this)
    delete json.coinProtocol
    return json
  }

}
