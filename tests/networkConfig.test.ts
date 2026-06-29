import { describe, it, expect, vi } from 'vitest';

// Mock the external modules before importing
vi.mock('@mysten/sui/client', () => ({
  getFullnodeUrl: vi.fn().mockReturnValue('https://fullnode.testnet.sui.io:443'),
}));

vi.mock('@mysten/dapp-kit', () => ({
  createNetworkConfig: vi.fn().mockImplementation((config) => ({
    networkConfig: config,
    useNetworkVariable: vi.fn(),
    useNetworkVariables: vi.fn(),
  })),
}));

vi.mock('../src/constants', () => ({
  TESTNET_PACKAGE_ID: '0x4cb081457b1e098d566a277f605ba48410e26e66eaab5b3be4f6c560e9501800',
}));

describe('networkConfig', () => {
  it('should export networkConfig, useNetworkVariable, and useNetworkVariables', async () => {
    const module = await import('../src/networkConfig');

    expect(module.networkConfig).toBeDefined();
    expect(module.useNetworkVariable).toBeDefined();
    expect(module.useNetworkVariables).toBeDefined();
  });

  it('should configure testnet with correct URL', async () => {
    const { createNetworkConfig } = await import('@mysten/dapp-kit');

    await import('../src/networkConfig');

    expect(createNetworkConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        testnet: expect.objectContaining({
          url: 'https://fullnode.testnet.sui.io:443',
        }),
      }),
    );
  });

  it('should configure testnet with packageId and gqlClient variables', async () => {
    const { createNetworkConfig } = await import('@mysten/dapp-kit');

    await import('../src/networkConfig');

    expect(createNetworkConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        testnet: expect.objectContaining({
          variables: expect.objectContaining({
            packageId: '0x4cb081457b1e098d566a277f605ba48410e26e66eaab5b3be4f6c560e9501800',
            gqlClient: 'https://sui-testnet.mystenlabs.com/graphql',
          }),
        }),
      }),
    );
  });
});
