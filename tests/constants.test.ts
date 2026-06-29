import { describe, it, expect } from 'vitest';
import { DEVNET_PACKAGE_ID, TESTNET_PACKAGE_ID, MAINNET_PACKAGE_ID } from '../src/constants';

describe('constants', () => {
  it('should export DEVNET_PACKAGE_ID as a placeholder', () => {
    expect(DEVNET_PACKAGE_ID).toBe('0xTODO');
  });

  it('should export TESTNET_PACKAGE_ID as a valid hex address', () => {
    expect(TESTNET_PACKAGE_ID).toMatch(/^0x[0-9a-f]{64}$/);
    expect(TESTNET_PACKAGE_ID).toBe(
      '0x4cb081457b1e098d566a277f605ba48410e26e66eaab5b3be4f6c560e9501800',
    );
  });

  it('should export MAINNET_PACKAGE_ID as a placeholder', () => {
    expect(MAINNET_PACKAGE_ID).toBe('0xTODO');
  });
});
