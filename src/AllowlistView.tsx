// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';
import { Button, Card, Flex, Grid } from '@radix-ui/themes';
import { fromHex } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { SessionKey } from '@mysten/seal';
import { useParams } from 'react-router-dom';
import { downloadAndDecrypt, getObjectExplorerLink, getObjectFields, MoveCallConstructor } from './utils';
import { usePolling, useSealClient } from './hooks';
import { TTL_MIN } from './constants';
import { DecryptedFilesDialog } from './DecryptedFilesDialog';
import { ErrorAlertDialog } from './ErrorAlertDialog';

export interface FeedData {
  allowlistId: string;
  allowlistName: string;
  blobIds: string[];
}

function constructMoveCall(packageId: string, allowlistId: string): MoveCallConstructor {
  return (tx: Transaction, id: string) => {
    tx.moveCall({
      target: `${packageId}::allowlist::seal_approve`,
      arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(allowlistId)],
    });
  };
}

const Feeds: React.FC<{ suiAddress: string }> = ({ suiAddress }) => {
  const suiClient = useSuiClient();
  const client = useSealClient();
  const packageId = useNetworkVariable('packageId');

  const [feed, setFeed] = useState<FeedData>();
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
  const { id } = useParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  usePolling(
    async () => {
      const allowlist = await suiClient.getObject({
        id: id!,
        options: { showContent: true },
      });
      const encryptedObjects = await suiClient
        .getDynamicFields({
          parentId: id!,
        })
        .then((res) => res.data.map((obj) => obj.name.value as string));
      const fields = getObjectFields(allowlist);
      const feedData = {
        allowlistId: id!,
        allowlistName: fields?.name,
        blobIds: encryptedObjects,
      };
      setFeed(feedData);
    },
    [id, suiClient, packageId],
  );

  const onView = async (blobIds: string[], allowlistId: string) => {
    if (
      currentSessionKey &&
      !currentSessionKey.isExpired() &&
      currentSessionKey.getAddress() === suiAddress
    ) {
      const moveCallConstructor = constructMoveCall(packageId, allowlistId);
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
            const moveCallConstructor = await constructMoveCall(packageId, allowlistId);
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
      <h2 style={{ marginBottom: '1rem' }}>
        Files for Allowlist {feed?.allowlistName} (ID{' '}
        {feed?.allowlistId && getObjectExplorerLink(feed.allowlistId)})
      </h2>
      {feed === undefined ? (
        <p>No files found for this allowlist.</p>
      ) : (
        <Grid columns="2" gap="3">
          <Card key={feed!.allowlistId}>
            <Flex direction="column" align="start" gap="2">
              {feed!.blobIds.length === 0 ? (
                <p>No files found for this allowlist.</p>
              ) : (
                <DecryptedFilesDialog
                  isOpen={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                  decryptedFileUrls={decryptedFileUrls}
                  onClose={() => setDecryptedFileUrls([])}
                  reloadKey={reloadKey}
                  trigger={
                    <Button onClick={() => onView(feed!.blobIds, feed!.allowlistId)}>
                      Download And Decrypt All Files
                    </Button>
                  }
                />
              )}
            </Flex>
          </Card>
        </Grid>
      )}
      <ErrorAlertDialog error={error} onClose={() => setError(null)} />
    </Card>
  );
};

export default Feeds;
