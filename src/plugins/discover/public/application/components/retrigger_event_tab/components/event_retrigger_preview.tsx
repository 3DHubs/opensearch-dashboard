/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBasicTable, EuiBasicTableColumn, EuiTableFieldDataColumnType } from '@elastic/eui';
import React from 'react';
import { TriggerDefinition } from '../types';
import './_event_retrigger_preview.scss';

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

export function EventRetriggerPreview({
  triggerDefinitions,
}: {
  triggerDefinitions: TriggerDefinition[];
}) {
  return (
    <EuiBasicTable
      tableCaption="Trigger Definitions"
      items={triggerDefinitions}
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
  );
}
