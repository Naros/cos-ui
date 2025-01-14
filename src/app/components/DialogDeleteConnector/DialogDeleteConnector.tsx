import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  Button,
  Modal,
  ModalVariant,
  Stack,
  StackItem,
  TextInput,
} from '@patternfly/react-core';

export interface DialogDeleteConnectorProps {
  connectorName: string | undefined;
  onCancel: () => void;
  onConfirm: () => void;
  showDialog: boolean;
}

/**
 * A modal dialog to display confirmation for connector deletion.
 */
export const DialogDeleteConnector: React.FunctionComponent<DialogDeleteConnectorProps> =
  ({ connectorName, onCancel, onConfirm, showDialog }) => {
    const { t } = useTranslation();
    const [nameValue, setNameValue] = useState('');
    const canDelete = nameValue === connectorName;

    const onCancelDelete = () => {
      setNameValue('');
      onCancel();
    };

    const onConfirmDelete = () => {
      setNameValue('');
      onConfirm();
    };

    return (
      <Modal
        variant={ModalVariant.small}
        title={t('Delete connector')}
        titleIconVariant="warning"
        isOpen={showDialog}
        onClose={onCancel}
        actions={[
          <Button
            key="confirm"
            variant="danger"
            isDisabled={!canDelete}
            onClick={onConfirmDelete}
          >
            {t('Delete')}
          </Button>,
          <Button key="cancel" variant="link" onClick={onCancelDelete}>
            {t('Cancel')}
          </Button>,
        ]}
      >
        <Stack>
          <StackItem>
            <Trans>
              Connector <strong>{{ connectorName }}</strong> will be deleted.
            </Trans>
          </StackItem>
          <StackItem>
            <Trans>
              Type <strong>{{ connectorName }}</strong> to confirm the deletion.
            </Trans>
          </StackItem>
          <StackItem>
            <TextInput
              value={nameValue}
              type="text"
              onChange={setNameValue}
              aria-label="name input"
            />
          </StackItem>
        </Stack>
      </Modal>
    );
  };
