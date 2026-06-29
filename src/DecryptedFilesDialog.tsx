// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Button, Dialog, Flex } from '@radix-ui/themes';

interface DecryptedFilesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  decryptedFileUrls: string[];
  onClose: () => void;
  reloadKey: number;
  trigger: React.ReactNode;
}

export function DecryptedFilesDialog({
  isOpen,
  onOpenChange,
  decryptedFileUrls,
  onClose,
  reloadKey,
  trigger,
}: DecryptedFilesDialogProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Trigger>{trigger}</Dialog.Trigger>
      {decryptedFileUrls.length > 0 && (
        <Dialog.Content maxWidth="450px" key={reloadKey}>
          <Dialog.Title>View all files retrieved from Walrus</Dialog.Title>
          <Flex direction="column" gap="2">
            {decryptedFileUrls.map((decryptedFileUrl, index) => (
              <div key={index}>
                <img src={decryptedFileUrl} alt={`Decrypted image ${index + 1}`} />
              </div>
            ))}
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" onClick={onClose}>
                Close
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      )}
    </Dialog.Root>
  );
}
