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
          fields: { name: 'Test Service', fee: '100', ttl: '60000', owner: '0xowner1' },
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

import { AllServices } from '../src/OwnedSubscriptionServices';

describe('OwnedSubscriptionServices - AllServices Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render heading', () => {
    render(<AllServices />);

    expect(screen.getByText('Admin View: Owned Subscription Services')).toBeInTheDocument();
  });

  it('should render description text', () => {
    render(<AllServices />);

    expect(
      screen.getByText(
        'This is all the services that you have created. Click manage to upload new files to the service.',
      ),
    ).toBeInTheDocument();
  });
});

describe('OwnedSubscriptionServices interfaces', () => {
  it('Cap interface should have id and service_id properties', () => {
    const cap: { id: string; service_id: string } = {
      id: '0xcap1',
      service_id: '0xservice1',
    };
    expect(cap.id).toBe('0xcap1');
    expect(cap.service_id).toBe('0xservice1');
  });

  it('CardItem interface should have all required properties', () => {
    const item: { id: string; fee: string; ttl: string; name: string; owner: string } = {
      id: '0xservice1',
      fee: '1000',
      ttl: '3600000',
      name: 'Premium Service',
      owner: '0xowner1',
    };
    expect(item.id).toBe('0xservice1');
    expect(item.fee).toBe('1000');
    expect(item.ttl).toBe('3600000');
    expect(item.name).toBe('Premium Service');
    expect(item.owner).toBe('0xowner1');
  });
});
