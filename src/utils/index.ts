import { PublicKey } from '@solana/web3.js';
import { PF_BONDING_CURVE_SEED, PF_PROGRAM_ID } from '../dto/common.dto';

export default class Utils{

  /**
   * @param {number} ms milliseconds, the sleep interval
   */
  public static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public static findPfBondingCurveAddress(tokenMint: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync([
      PF_BONDING_CURVE_SEED,
      tokenMint.toBuffer(),
    ], PF_PROGRAM_ID)[0];
  }

}
