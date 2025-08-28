/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButton,
  EuiCallOut,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiEmptyPrompt,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiTableFieldDataColumnType,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DocViewRenderProps } from '../../doc_views/doc_views_types';
import './_retrigger_event_tab.scss';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';

// table columns
const columns: Array<EuiBasicTableColumn<TriggerDefinition>> = [
  {
    field: 'name',
    name: 'NAME',
  },
  {
    field: 'source',
    name: 'SOURCE',
  },
  {
    field: 'type',
    name: 'TYPE',
  },
  {
    field: 'extra',
    name: 'EXTRA',
  },
  {
    field: 'subscriberName',
    name: 'SUBSCRIBER NAME',
  },
  {
    field: 'subscriberPath',
    name: 'SUBSCRIBER PATH',
  },
];

interface TriggerDefinition {
  id: number;
  name: string;
  source: string | null | undefined;
  type: string;
  extra?: string | null | undefined;
  subscriberName: string;
  subscriberPath: string;
  subscriberUrl: string;
}

interface Event {
  id: string;
  source: string;
  extra: string | null | undefined;
  type: string;
  time: string;
  data: { [key: string]: any }; // the entire event payload
}

interface RetriggerEventPayload {
  event: Event;
  subscriber_url: string;
}

// todo: remove this hardcoded event
const EVENT = {
  TYPE: 'user.plf.sf-id-changed.v1',
  time: '2025-08-07T19:35:06.309478+00:00',
  source: 'plf/salesforce',
  ce_extra: null,
  event_id: '8847ebde-ed2a-419f-8cc3-a90be2b27dc5',
  new_sf_id: '001VC00003DSR4JYAX',
  plf_user_id: 'ebcd49ea-52d0-4787-9848-63906f99a262',
  previous_sf_id: null,
  old_account_was_shell: false,
};

export function RetriggerEventTab({ hit }: DocViewRenderProps) {
  const label = i18n.translate('discover.docViews.eventRetrigger.retriggerGridAriaLabel', {
    defaultMessage: 'Event retrigger for an opensearch document',
  });

  const {
    services: { notifications },
  } = useOpenSearchDashboards();

  // the document source contains the event data
  const source = hit._source as Record<string, any>;

  // combo box search related states
  const [searchOptions, setSearchOptions] = useState<EuiComboBoxOptionOption[]>([]);
  const [selectedSearchOptions, setSelectedSearchOptions] = useState<EuiComboBoxOptionOption[]>([]);

  // general states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isValidEventState, setIsValidEventState] = useState(false);

  // other data states
  const [fetchedTriggerDefs, setFetchedTriggerDefs] = useState<TriggerDefinition[]>([]);
  const [selectedTriggerDefs, setSelectedTriggerDefs] = useState<TriggerDefinition[]>([]);

  useEffect(() => {
    // we only want to enable this tab if the document has an eventId field
    // our custom events have this field, and it is required to fetch triggers
    setIsValidEventState(source.eventId !== undefined);
  }, [source]);

  useEffect(() => {
    if (error) {
      notifications?.toasts.addError(error, {
        title: 'An Error occurred',
        toastMessage: 'Please check the console for more details.',
      });
    }
  }, [error, notifications]);

  const handleFetchedTriggers = useCallback((data: Record<string, any>) => {
    // Map the fetched data to TriggerDefinition type
    const mappedTriggers: TriggerDefinition[] = data.map((item: any, index: number) => ({
      id: item.id,
      name: item.name,
      source: item.source,
      type: item.type,
      extra: item.extra,
      subscriberName: item.subscriber_name,
      subscriberPath: item.subscriber_path,
      subscriberUrl: item.subscriber_url,
    }));

    // set the options for the combo box
    const fetchedOptions: EuiComboBoxOptionOption[] = mappedTriggers.map(
      (trigger: TriggerDefinition, index: number) => ({
        // This is a concatenation of subscriber_name and subscriber_path (if available or name)
        // "modelrepo-event-handler (/handle-part-price-ready)" or using name
        // "dfmservice-event-handler (dfm-service-handle-part-config-event-src1)"
        label: `${trigger.subscriberName} (${trigger.subscriberPath ?? trigger.name})`,
        value: trigger.id,
        key: trigger.id.toString(),
      })
    );

    setSearchOptions(fetchedOptions);
    setFetchedTriggerDefs(mappedTriggers);
  }, []);

  useEffect(() => {
    // todo: update to real validation
    // if (!isValidEventState) return;
    setIsLoading(true);

    // todo: update to real fetch call
    fetch('http://localhost:8300/triggers?event_id=8847ebde-ed2a-419f-8cc3-a90be2b27dc5')
      .then((response) => response.json())
      .then((data) => {
        if (data?.error) throw new Error(data.error);

        handleFetchedTriggers(data);
      })
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
  }, [isValidEventState, handleFetchedTriggers]);

  const mapSelectedTriggerDefsToPayloads = (): RetriggerEventPayload[] => {
    return selectedTriggerDefs.map((triggerDef) => {
      // todo: replace hardcoded event with real event from source
      // const event = source;
      const event = EVENT;
      return {
        event: {
          id: event.event_id,
          source: event.source,
          extra: event.extra,
          type: event.TYPE,
          time: event.time,
          data: event,
        },
        subscriber_url: triggerDef.subscriberUrl,
      };
    });
  };

  const retriggerApiRequest = async (payload: RetriggerEventPayload) => {
    // todo: update to real fetch call
    const response = await fetch(`http://localhost:8300/retrigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok)
      return {
        status: response.status,
        statusText: response.statusText,
        subscriberUrl: payload.subscriber_url,
      };

    const errorData = await response.json();
    throw new Error(
      errorData?.error ||
        errorData?.message ||
        JSON.stringify(errorData?.detail) ||
        'Unknown error occurred in retriggering event'
    );
  };

  const handleRetriggerSubmit = () => {
    if (selectedTriggerDefs.length === 0) {
      notifications?.toasts.addDanger(
        'Please select at least one trigger definition before submitting.'
      );
      return;
    }

    setIsSubmitting(true);
    const payloads = mapSelectedTriggerDefsToPayloads();

    Promise.all(payloads.map(retriggerApiRequest))
      .catch((err) => setError(err))
      .then((values) => handleRetriggerSuccess(values))
      .finally(() => setIsSubmitting(false));
  };

  const handleRetriggerSuccess = (values: void | Record<string, any>) => {
    if (values) {
      notifications?.toasts.addSuccess({
        title: 'Retrigger successful',
        text: `Submitted retrigger requests to ${values?.length || 0} subscribers.`,
      });
    }
  };

  const onSearchChange = (optionsSelected: EuiComboBoxOptionOption[]) => {
    setSelectedSearchOptions(optionsSelected);

    // find the id of the selected trigger definitions options. value is the key we need.
    const selectedIds = optionsSelected.map((option) => option.value);
    const filteredTriggers = fetchedTriggerDefs.filter((option) => selectedIds.includes(option.id));

    setSelectedTriggerDefs(filteredTriggers);
  };

  if (isValidEventState) {
    // todo: update to !isValidEvent after testing
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

  return (
    <EuiFlexGrid columns={1} aria-label={label}>
      <EuiFlexItem>
        <EuiCallOut
          size={'s'}
          title={`Retriggering event for id ${source.eventId || hit._id}`}
          iconType="bell"
        >
          <p>*Select a trigger to see the preview before submitting.</p>
        </EuiCallOut>
        <EuiSpacer size="l" />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiComboBox
              aria-label="Trigger definitions combo box"
              placeholder="Select triggers"
              options={searchOptions}
              fullWidth={true}
              selectedOptions={selectedSearchOptions}
              onChange={onSearchChange}
              isClearable={true}
              data-test-subj="triggersComboBox"
              isLoading={isLoading}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              isLoading={isSubmitting}
              fill={true}
              iconType={'check'}
              disabled={selectedTriggerDefs.length === 0}
              data-test-subj="submitRetriggerButton"
              onClick={handleRetriggerSubmit}
            >
              Submit
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="xl" />

        <EuiBasicTable
          tableCaption="Trigger Definitions"
          items={selectedTriggerDefs}
          rowHeader="name"
          columns={columns}
          rowProps={(triggerDefinition: TriggerDefinition) => {
            const { name } = triggerDefinition;
            return {
              'data-test-subj': `row-${name.toLowerCase()}`,
              className: 'euiText--extraSmall',
              onClick: () => {},
            };
          }}
          cellProps={(
            triggerDefinition: TriggerDefinition,
            column: EuiTableFieldDataColumnType<TriggerDefinition>
          ) => {
            const { name } = triggerDefinition;
            const { field } = column;
            return {
              className: 'customCellClass',
              'data-test-subj': `cell-${name}-${String(field)}`,
              textOnly: true,
            };
          }}
        />
        <EuiSpacer size="xl" />
      </EuiFlexItem>
    </EuiFlexGrid>
  );
}
