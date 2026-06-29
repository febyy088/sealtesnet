// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex } from '@radix-ui/themes';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { useNavigate } from 'react-router-dom';
import { useExecuteTransaction } from './hooks';
import { GAS_BUDGET } from './constants';

export function CreateAllowlist() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const packageId = useNetworkVariable('packageId');
  const { mutate: signAndExecute } = useExecuteTransaction();

  function createAllowlist(name: string) {
    if (name === '') {
      alert('Please enter a name for the allowlist');
      return;
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::allowlist::create_allowlist_entry`,
      arguments: [tx.pure.string(name)],
    });
    tx.setGasBudget(GAS_BUDGET);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('res', result);
          const allowlistObject = result.effects?.created?.find(
            (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
          );
          const createdObjectId = allowlistObject?.reference?.objectId;
          if (createdObjectId) {
            window.open(
              `${window.location.origin}/allowlist-example/admin/allowlist/${createdObjectId}`,
              '_blank',
            );
          }
        },
      },
    );
  }

  const handleViewAll = () => {
    navigate(`/allowlist-example/admin/allowlists`);
  };

  return (
    <Card>
      <h2 style={{ marginBottom: '1rem' }}>Admin View: Allowlist</h2>
      <Flex direction="row" gap="2" justify="start">
        <input placeholder="Allowlist Name" onChange={(e) => setName(e.target.value)} />
        <Button
          size="3"
          onClick={() => {
            createAllowlist(name);
          }}
        >
          Create Allowlist
        </Button>
        <Button size="3" onClick={handleViewAll}>
          View All Created Allowlists
        </Button>
      </Flex>
    </Card>
  );
}
