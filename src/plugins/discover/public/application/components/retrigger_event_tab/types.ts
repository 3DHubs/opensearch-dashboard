/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

interface TriggerDefinition {
  id: number;
  name: string;
  source: string | null | undefined;
  type: string;
  extra: string | null | undefined;
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

export type { TriggerDefinition, Event, RetriggerEventPayload };
