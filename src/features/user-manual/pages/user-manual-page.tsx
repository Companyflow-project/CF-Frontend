import React from 'react';
import { useTranslation } from 'react-i18next';
import { userManualApi } from '../api';
import { userManualRoutes } from '../routes';
import { BookReader } from '../components/book-reader';

export const UserManualPage: React.FC = () => {
    const { t } = useTranslation('common');
    return (
        <BookReader
            title={t('userManual')}
            routeBase={userManualRoutes.root}
            loadTree={userManualApi.getTree}
            loadSection={userManualApi.getSection}
        />
    );
};
