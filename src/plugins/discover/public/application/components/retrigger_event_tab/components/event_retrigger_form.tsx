/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButton,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import React, { useCallback, useEffect, useState } from 'react';
import { RetriggerEventPayload, TriggerDefinition } from '../types';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';

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

// todo: update to real api url
const BASE_API_URL = 'http://localhost:8300';

interface EventRetriggerFormProps {
  event: Record<string, any>;
  isValidEvent: boolean;
  onTriggersSelected: (selectedTriggers: TriggerDefinition[]) => void;
  selectedTriggerDefinitions: TriggerDefinition[];
}

export function EventRetriggerForm({
  event,
  isValidEvent,
  onTriggersSelected,
  selectedTriggerDefinitions,
}: EventRetriggerFormProps) {
  const {
    services: { notifications },
  } = useOpenSearchDashboards();

  // combo box search related states
  const [searchOptions, setSearchOptions] = useState<EuiComboBoxOptionOption[]>([]);
  const [selectedSearchOptions, setSelectedSearchOptions] = useState<EuiComboBoxOptionOption[]>([]);

  // general states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // other data states
  const [fetchedTriggerDefs, setFetchedTriggerDefs] = useState<TriggerDefinition[]>([]);

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
    const mappedTriggers: TriggerDefinition[] = data.map((item: any) => ({
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
      (trigger: TriggerDefinition) => ({
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
    // if (!isValidEvent) return;
    setIsLoading(true);

    // todo: remove this hardcoded event after testing
    event.event_id = '8847ebde-ed2a-419f-8cc3-a90be2b27dc5';

    fetch(`${BASE_API_URL}/triggers?event_id=${event.event_id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.error) throw new Error(data.error);

        handleFetchedTriggers(data);
      })
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
  }, [isValidEvent, event, handleFetchedTriggers]);

  const onSearchChange = (optionsSelected: EuiComboBoxOptionOption[]) => {
    setSelectedSearchOptions(optionsSelected);

    // find the id of the selected trigger definitions options. value is the key we need.
    const selectedIds = optionsSelected.map((option) => option.value);
    const filteredTriggers = fetchedTriggerDefs.filter((option) => selectedIds.includes(option.id));

    onTriggersSelected(filteredTriggers);
  };

  const mapSelectedTriggerDefsToPayloads = (): RetriggerEventPayload[] => {
    return selectedTriggerDefinitions.map((triggerDef) => {
      // todo: replace hardcoded event with real event from source
      event = EVENT;
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
    const response = await fetch(`${BASE_API_URL}/retrigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) return { subscriberUrl: payload.subscriber_url, status: response.status };

    const errorData = await response.json();
    // eslint-disable-next-line no-console
    console.error('Error retriggering event:', errorData);

    throw new Error(
      errorData?.error ||
        errorData?.message ||
        JSON.stringify(errorData?.detail) ||
        'Unknown error occurred in retriggering event'
    );
  };

  const handleRetriggerSubmit = () => {
    if (selectedTriggerDefinitions.length === 0) {
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

  return (
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
          disabled={selectedTriggerDefinitions.length === 0}
          data-test-subj="submitRetriggerButton"
          onClick={handleRetriggerSubmit}
        >
          Submit
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
