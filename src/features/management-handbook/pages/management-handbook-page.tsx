import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookReader } from '@/features/user-manual/components/book-reader';
import { managementHandbookApi } from '../api';
import { managementHandbookRoutes } from '../routes';

/** The management handbook, read-only. CompanyFlow edits it under Superadmin. */
export const ManagementHandbookPage: React.FC = () => {
    const { t } = useTranslation('common');
    return (
        <BookReader
            embedded
            title={t('nav.managementHandbook')}
            routeBase={managementHandbookRoutes.root}
            loadTree={managementHandbookApi.getTree}
            loadSection={managementHandbookApi.getSection}
        />
    );
};
