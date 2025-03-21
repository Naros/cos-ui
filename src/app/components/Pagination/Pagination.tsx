import React, { FunctionComponent } from 'react';

import { Pagination as PFPagination } from '@patternfly/react-core';

export type PaginationProps = {
  itemCount: number;
  page: number;
  perPage: number;
  isCompact?: boolean;
  onChange: (page: number, perPage: number) => void;
};
export const Pagination: FunctionComponent<PaginationProps> = ({
  itemCount,
  page,
  perPage,
  isCompact = false,
  onChange,
}) => {
  const defaultPerPageOptions = [
    {
      title: '1',
      value: 1,
    },
    {
      title: '5',
      value: 5,
    },
    {
      title: '10',
      value: 10,
    },
  ];
  return (
    <PFPagination
      itemCount={itemCount}
      page={page}
      perPage={perPage}
      perPageOptions={defaultPerPageOptions}
      onSetPage={(_, page) => onChange(page, perPage)}
      onPerPageSelect={(_, perPage) => onChange(page, perPage)}
      variant={isCompact ? 'top' : 'bottom'}
      isCompact={isCompact}
    />
  );
};
