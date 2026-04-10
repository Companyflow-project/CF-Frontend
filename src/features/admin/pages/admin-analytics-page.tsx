import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAdminAnalytics } from '../hooks';

interface BarChartProps {
  title: string;
  data: Array<{ label: string; value: number }>;
  color: string;
}

const HorizontalBarChart: React.FC<BarChartProps> = ({ title, data, color }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            No data available
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 text-right tabular-nums flex-shrink-0 truncate">
                  {item.label}
                </span>
                <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-all duration-300"
                    style={{
                      width: `${Math.max((item.value / maxValue) * 100, 1)}%`,
                      backgroundColor: color,
                    }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-700 tabular-nums">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const AdminAnalyticsPage: React.FC = () => {
  const { t } = useTranslation('admin');
  const { data, isLoading } = useAdminAnalytics();

  const signupsData = (data?.signupsPerWeek ?? []).map((d) => ({
    label: d.week,
    value: d.count,
  }));

  const userGrowthData = (data?.userGrowth ?? []).map((d) => ({
    label: d.week,
    value: d.newUsers,
  }));

  const smsData = (data?.smsUsage ?? []).map((d) => ({
    label: d.month,
    value: d.count,
  }));

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="py-20 text-center text-gray-400">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('analytics.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('analytics.description')}
        </p>
      </div>

      <div className="grid gap-6">
        <HorizontalBarChart
          title={t('analytics.signupsPerWeek')}
          data={signupsData}
          color="#3d997d"
        />
        <HorizontalBarChart
          title={t('analytics.userGrowth')}
          data={userGrowthData}
          color="#3b82f6"
        />
        <HorizontalBarChart
          title={t('analytics.smsUsage')}
          data={smsData}
          color="#f59e0b"
        />
      </div>
    </div>
  );
};
