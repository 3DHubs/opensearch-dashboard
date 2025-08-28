/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFlexGrid, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DocViewRenderProps } from '../../doc_views/doc_views_types';
import { InvalidEventView } from './components/invalid_event_view';
import { EventRetriggerCallout } from './components/event_retrigger_callout';
import { TriggerDefinition } from './types';
import { EventRetriggerPreview } from './components/event_retrigger_preview';
import { EventRetriggerForm } from './components/event_retrigger_form';

export function RetriggerEventTab({ hit }: DocViewRenderProps) {
  const label = i18n.translate('discover.docViews.eventRetrigger.retriggerGridAriaLabel', {
    defaultMessage: 'Event retrigger for an opensearch document',
  });

  // the document source contains the event data
  const event = hit._source as Record<string, any>;
  const isValidEvent = event.eventId !== undefined;

  const [selectedTriggerDefs, setSelectedTriggerDefs] = useState<TriggerDefinition[]>([]);

  if (isValidEvent) {
    // todo: update to !isValidEvent after testing
    return <InvalidEventView />;
  }

  return (
    <EuiFlexGrid columns={1} aria-label={label}>
      <EuiFlexItem>
        <EventRetriggerCallout eventId={(event?.eventId || hit._id) as string} />
        <EuiSpacer size="l" />

        <EventRetriggerForm
          event={event}
          isValidEvent={isValidEvent}
          onTriggersSelected={setSelectedTriggerDefs}
          selectedTriggerDefinitions={selectedTriggerDefs}
        />

        <EuiSpacer size="xl" />
        <EventRetriggerPreview triggerDefinitions={selectedTriggerDefs} />
        <EuiSpacer size="xl" />
      </EuiFlexItem>
    </EuiFlexGrid>
  );
}
