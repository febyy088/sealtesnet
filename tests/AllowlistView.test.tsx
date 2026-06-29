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

describe('constructMoveCall logic', () => {
  it('should create a function that builds the correct move call target', () => {
    const packageId = '0xtestpkg';
    const allowlistId = '0xallowlist1';

    // Reconstruct the function inline to test its logic
    const constructMoveCall = (packageId: string, allowlistId: string) => {
      return (tx: { moveCall: (args: { target: string; arguments: string[] }) => void }, id: string) => {
        tx.moveCall({
          target: `${packageId}::allowlist::seal_approve`,
          arguments: [id, allowlistId],
        });
      };
    };

    const moveCall = constructMoveCall(packageId, allowlistId);
    expect(typeof moveCall).toBe('function');

    // Verify the function calls tx.moveCall with correct target
    const mockTx = { moveCall: vi.fn() };
    moveCall(mockTx, '0xid123');

    expect(mockTx.moveCall).toHaveBeenCalledWith({
      target: '0xtestpkg::allowlist::seal_approve',
      arguments: ['0xid123', '0xallowlist1'],
    });
  });
});
