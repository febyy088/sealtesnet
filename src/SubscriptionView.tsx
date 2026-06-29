// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import {
  useCurrentAccount,
  useSignPersonalMessage,
  useSuiClient,
} from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';
import { Button, Card, Flex } from '@radix-ui/themes';
import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { fromHex, SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { SessionKey } from '@mysten/seal';
import { useParams } from 'react-router-dom';
import { downloadAndDecrypt, getObjectExplorerLink, getObjectFields, MoveCallConstructor } from './utils';
import { useExecuteTransaction, usePolling, useSealClient } from './hooks';
import { GAS_BUDGET, TTL_MIN } from './constants';
import { DecryptedFilesDialog } from './DecryptedFilesDialog';
import { ErrorAlertDialog } from './ErrorAlertDialog';

export interface FeedData {
  id: string;
  fee: string;
  ttl: string;
  owner: string;
  name: string;
  blobIds: string[];
  subscriptionId?: string;
}

const FeedsToSubscribe: React.FC<{ suiAddress: string }> = ({ suiAddress }) => {
  const suiClient = useSuiClient();
  const { id } = useParams();

  const client = useSealClient();
  const [feed, setFeed] = useState<FeedData>();
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  const { mutate: signAndExecute } = useExecuteTransaction();

  usePolling(
    async () => {
      const encryptedObjects = await suiClient
        .getDynamicFields({
          parentId: id!,
        })
        .then((res) => res.data.map((obj) => obj.name.value as string));

      const service = await suiClient.getObject({
        id: id!,
        options: { showContent: true },
      });
      const service_fields = getObjectFields(service);

      const res = await suiClient.getOwnedObjects({
        owner: suiAddress,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${packageId}::subscription::Subscription`,
        },
      });

      const clock = await suiClient.getObject({
        id: '0x6',
        options: { showContent: true },
      });
      const clockFields = getObjectFields(clock);
      const current_ms = clockFields.timestamp_ms;

      const valid_subscription = res.data
        .map((obj) => {
          const fields = getObjectFields(obj);
          const x = {
            id: fields?.id.id,
            created_at: parseInt(fields?.created_at),
            service_id: fields?.service_id,
          };
          return x;
        })
        .filter((item) => item.service_id === service_fields.id.id)
        .find((item) => {
          return item.created_at + parseInt(service_fields.ttl) > current_ms;
        });

      const feedData = {
        ...service_fields,
        id: service_fields.id.id,
        blobIds: encryptedObjects,
        subscriptionId: valid_subscription?.id,
      } as FeedData;
      setFeed(feedData);
    },
    [id, suiAddress, packageId, suiClient],
  );

  function constructMoveCall(
    packageId: string,
    serviceId: string,
    subscriptionId: string,
  ): MoveCallConstructor {
    return (tx: Transaction, id: string) => {
      tx.moveCall({
        target: `${packageId}::subscription::seal_approve`,
        arguments: [
          tx.pure.vector('u8', fromHex(id)),
          tx.object(subscriptionId),
          tx.object(serviceId),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      });
    };
  }

  async function handleSubscribe(serviceId: string, fee: number) {
    const address = currentAccount?.address!;
    const tx = new Transaction();
    tx.setGasBudget(GAS_BUDGET);
    tx.setSender(address);
    const subscription = tx.moveCall({
      target: `${packageId}::subscription::subscribe`,
      arguments: [
        coinWithBalance({
          balance: BigInt(fee),
        }),
        tx.object(serviceId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
    tx.moveCall({
      target: `${packageId}::subscription::transfer`,
      arguments: [tx.object(subscription), tx.pure.address(address)],
    });

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('res', result);
        },
      },
    );
  }

  const onView = async (
    blobIds: string[],
    serviceId: string,
    fee: number,
    subscriptionId?: string,
  ) => {
    if (!subscriptionId) {
      return handleSubscribe(serviceId, fee);
    }

    if (
      currentSessionKey &&
      !currentSessionKey.isExpired() &&
      currentSessionKey.getAddress() === suiAddress
    ) {
      const moveCallConstructor = constructMoveCall(packageId, serviceId, subscriptionId);
      downloadAndDecrypt(
        blobIds,
        currentSessionKey,
        suiClient,
        client,
        moveCallConstructor,
        setError,
        setDecryptedFileUrls,
        setIsDialogOpen,
        setReloadKey,
      );
      return;
    }
    setCurrentSessionKey(null);

    const sessionKey = new SessionKey({
      address: suiAddress,
      packageId,
      ttlMin: TTL_MIN,
    });

    try {
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            await sessionKey.setPersonalMessageSignature(result.signature);
            const moveCallConstructor = await constructMoveCall(
              packageId,
              serviceId,
              subscriptionId,
            );
            await downloadAndDecrypt(
              blobIds,
              sessionKey,
              suiClient,
              client,
              moveCallConstructor,
              setError,
              setDecryptedFileUrls,
              setIsDialogOpen,
              setReloadKey,
            );
            setCurrentSessionKey(sessionKey);
          },
        },
      );
    } catch (error: unknown) {
      console.error('Error:', error);
    }
  };

  return (
    <Card>
      {feed === undefined ? (
        <p>Waiting for files...</p>
      ) : (
        <Card key={feed!.id}>
          <h2 style={{ marginBottom: '1rem' }}>
            Files for subscription service {feed!.name} (ID {getObjectExplorerLink(feed!.id)})
          </h2>
          <Flex direction="column" gap="2">
            {feed!.blobIds.length === 0 ? (
              <p>No Files yet.</p>
            ) : (
              <DecryptedFilesDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                decryptedFileUrls={decryptedFileUrls}
                onClose={() => setDecryptedFileUrls([])}
                reloadKey={reloadKey}
                trigger={
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Button
                      onClick={() =>
                        onView(feed!.blobIds, feed!.id, Number(feed!.fee), feed!.subscriptionId)
                      }
                    >
                      {feed!.subscriptionId ? (
                        <div>Download And Decrypt All Files</div>
                      ) : (
                        <div>
                          Subscribe for {feed!.fee} MIST for{' '}
                          {Math.floor(parseInt(feed!.ttl) / 60 / 1000)} minutes
                        </div>
                      )}
                    </Button>
                  </div>
                }
              />
            )}
          </Flex>
        </Card>
      )}
      <ErrorAlertDialog error={error} onClose={() => setError(null)} />
    </Card>
  );
};

export default FeedsToSubscribe;
