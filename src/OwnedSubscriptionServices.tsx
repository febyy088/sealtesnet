// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { Button, Card } from '@radix-ui/themes';
import { getObjectExplorerLink, getObjectFields } from './utils';
import { usePolling } from './hooks';

export interface Cap {
  id: string;
  service_id: string;
}

export interface CardItem {
  id: string;
  fee: string;
  ttl: string;
  name: string;
  owner: string;
}

export function AllServices() {
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [cardItems, setCardItems] = useState<CardItem[]>([]);

  usePolling(
    async () => {
      const res = await suiClient.getOwnedObjects({
        owner: currentAccount?.address!,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${packageId}::subscription::Cap`,
        },
      });
      const caps = res.data
        .map((obj) => {
          const fields = getObjectFields(obj);
          return {
            id: fields?.id.id,
            service_id: fields?.service_id,
          };
        })
        .filter((item) => item !== null) as Cap[];

      const items: CardItem[] = await Promise.all(
        caps.map(async (cap) => {
          const service = await suiClient.getObject({
            id: cap.service_id,
            options: { showContent: true },
          });
          const fields = getObjectFields(service);
          return {
            id: cap.service_id,
            fee: fields.fee,
            ttl: fields.ttl,
            owner: fields.owner,
            name: fields.name,
          };
        }),
      );
      setCardItems(items);
    },
    [currentAccount?.address],
  );

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Admin View: Owned Subscription Services</h2>
      <p style={{ marginBottom: '2rem' }}>
        This is all the services that you have created. Click manage to upload new files to the
        service.
      </p>
      {cardItems.map((item) => (
        <Card key={`${item.id}`}>
          <p>
            <strong>
              {item.name} (ID {getObjectExplorerLink(item.id)})
            </strong>
          </p>
          <p>Subscription Fee: {item.fee} MIST</p>
          <p>Subscription Duration: {item.ttl ? parseInt(item.ttl) / 60 / 1000 : 'null'} minutes</p>
          <Button
            onClick={() => {
              window.open(
                `${window.location.origin}/subscription-example/admin/service/${item.id}`,
                '_blank',
              );
            }}
          >
            Manage
          </Button>
        </Card>
      ))}
    </div>
  );
}
