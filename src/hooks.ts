// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useMemo } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { getAllowlistedKeyServers, SealClient } from '@mysten/seal';
import { POLLING_INTERVAL_MS } from './constants';

export function useExecuteTransaction() {
  const suiClient = useSuiClient();
  return useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });
}

export function useSealClient(): SealClient {
  const suiClient = useSuiClient();
  return useMemo(
    () =>
      new SealClient({
        suiClient,
        serverObjectIds: getAllowlistedKeyServers('testnet'),
        verifyKeyServers: false,
      }),
    [suiClient],
  );
}

export function usePolling(callback: () => void, deps: React.DependencyList): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    savedCallback.current();

    const intervalId = setInterval(() => {
      savedCallback.current();
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
