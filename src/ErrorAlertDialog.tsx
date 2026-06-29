// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { AlertDialog, Button, Flex } from '@radix-ui/themes';

interface ErrorAlertDialogProps {
  error: string | null;
  onClose: () => void;
}

export function ErrorAlertDialog({ error, onClose }: ErrorAlertDialogProps) {
  return (
    <AlertDialog.Root open={!!error} onOpenChange={onClose}>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>Error</AlertDialog.Title>
        <AlertDialog.Description size="2">{error}</AlertDialog.Description>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Action>
            <Button variant="solid" color="gray" onClick={onClose}>
              Close
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
