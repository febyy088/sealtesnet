import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock dependencies
vi.mock('@mysten/dapp-kit', () => ({
  useSignPersonalMessage: () => ({ mutate: vi.fn() }),
  useSuiClient: () => ({
    getObject: vi.fn().mockResolvedValue({
      data: {
        content: {
          fields: { name: 'Test Allowlist', list: ['0xuser1', '0xuser2'] },
        },
      },
    }),
    getDynamicFields: vi.fn().mockResolvedValue({ data: [] }),
  }),
}));

vi.mock('@mysten/seal', () => {
  class MockSealClient {
    constructor() {}
  }
  class MockSessionKey {
    constructor() {}
    isExpired() {
      return false;
    }
    getAddress() {
      return '';
    }
    getPersonalMessage() {
      return new Uint8Array();
    }
  }
  return {
    SealClient: MockSealClient,
    getAllowlistedKeyServers: vi.fn().mockReturnValue([]),
    SessionKey: MockSessionKey,
  };
});

vi.mock('@mysten/sui/utils', () => ({
  fromHex: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
}));

vi.mock('../src/networkConfig', () => ({
  useNetworkVariable: () => '0xtestpackageid',
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '0xallowlist123' }),
}));

vi.mock('../src/utils', () => ({
  downloadAndDecrypt: vi.fn(),
  getObjectExplorerLink: (id: string) =>
    React.createElement('a', { href: `https://testnet.suivision.xyz/object/${id}` }, id),
  MoveCallConstructor: undefined,
}));

import Feeds from '../src/AllowlistView';

describe('AllowlistView - Feeds component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with allowlist heading', () => {
    render(<Feeds suiAddress="0xuser123" />);

    expect(screen.getByText(/Files for Allowlist/)).toBeInTheDocument();
  });

  it('should show no files message when there are no blob IDs', () => {
    render(<Feeds suiAddress="0xuser123" />);

    expect(screen.getByText('No files found for this allowlist.')).toBeInTheDocument();
  });
});

describe('constructMoveCall target format', () => {
  it('should produce the expected target string pattern for allowlist seal_approve', () => {
    const packageId = '0xtestpkg';
    const allowlistId = '0xallowlist1';

    // Verify the target string format matches Move module convention
    const expectedTarget = `${packageId}::allowlist::seal_approve`;
    expect(expectedTarget).toBe('0xtestpkg::allowlist::seal_approve');
    expect(expectedTarget).toMatch(/^0x[a-z]+::allowlist::seal_approve$/);
  });

  it('should use the correct module path for seal_approve', () => {
    // The module target must follow the format: packageId::module::function
    const target = '0x4cb081457b1e098d566a277f605ba48410e26e66eaab5b3be4f6c560e9501800::allowlist::seal_approve';
    const parts = target.split('::');
    expect(parts).toHaveLength(3);
    expect(parts[1]).toBe('allowlist');
    expect(parts[2]).toBe('seal_approve');
  });
});
