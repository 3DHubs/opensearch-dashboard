/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiEmptyPrompt, EuiLink, EuiSpacer, EuiTitle } from '@elastic/eui';
import React from 'react';

export function InvalidEventView() {
  return (
    <>
      <EuiSpacer size="xl" />
      <EuiEmptyPrompt
        iconType="folderExclamation"
        iconColor={'warning'}
        title={<h2>Event retrigger is deactivated</h2>}
        titleSize="xs"
        body={
          <p>
            This usually happens if the selected document is missing required fields or not
            compatible with the event structure we expect.
          </p>
        }
        actions={
          <>
            <EuiTitle size="xxs">
              <h3>Do you think something is wrong?</h3>
            </EuiTitle>
            <EuiLink href="#" target="_blank">
              Reach out to the CoreOps team for help
            </EuiLink>
          </>
        }
      />
    </>
  );
}
