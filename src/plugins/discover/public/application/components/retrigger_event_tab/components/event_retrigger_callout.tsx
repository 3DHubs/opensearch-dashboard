/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut } from '@elastic/eui';
import React from 'react';

export function EventRetriggerCallout({ eventId }: { eventId: string }) {
  return (
    <EuiCallOut size={'s'} title={`Retriggering event for id ${eventId}`} iconType="bell">
      <p>*Select a trigger to see the preview before submitting.</p>
    </EuiCallOut>
  );
}
