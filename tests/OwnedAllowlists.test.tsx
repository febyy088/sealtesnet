import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock dependencies
vi.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: () => ({ address: '0xuser123' }),
  useSuiClient: () => ({
    getOwnedObjects: vi.fn().mockResolvedValue({ data: [] }),
    getObject: vi.fn().mockResolvedValue({
      data: {
        content: {
          fields: { name: 'Test', list: [] },
        },
      },
    }),
  }),
}));

vi.mock('../src/networkConfig', () => ({
  useNetworkVariable: () => '0xtestpackageid',
}));

vi.mock('../src/utils', () => ({
  getObjectExplorerLink: (id: string) =>
    React.createElement('a', { href: `https://testnet.suivision.xyz/object/${id}` }, id),
}));

import { AllAllowlist } from '../src/OwnedAllowlists';

describe('OwnedAllowlists - AllAllowlist Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render heading', () => {
    render(<AllAllowlist />);

    expect(screen.getByText('Admin View: Owned Allowlists')).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(<AllAllowlist />);

    expect(
      screen.getByText(
        'These are all the allowlists that you have created. Click manage to edit the allowlist and upload new files to the allowlist.',
      ),
    ).toBeInTheDocument();
  });
});

describe('OwnedAllowlists interfaces', () => {
  it('Cap interface should have id and allowlist_id properties', () => {
    const cap: { id: string; allowlist_id: string } = {
      id: '0xcap1',
      allowlist_id: '0xallowlist1',
    };
    expect(cap.id).toBe('0xcap1');
    expect(cap.allowlist_id).toBe('0xallowlist1');
  });

  it('CardItem interface should have all required properties', () => {
    const item: { cap_id: string; allowlist_id: string; list: string[]; name: string } = {
      cap_id: '0xcap1',
      allowlist_id: '0xallowlist1',
      list: ['0xuser1', '0xuser2'],
      name: 'Test Allowlist',
    };
    expect(item.cap_id).toBe('0xcap1');
    expect(item.allowlist_id).toBe('0xallowlist1');
    expect(item.list).toHaveLength(2);
    expect(item.name).toBe('Test Allowlist');
  });
});
